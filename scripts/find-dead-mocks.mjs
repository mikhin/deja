import { globSync, readFileSync } from "node:fs";
import path from "node:path";

import { resolveModule, ROOT } from "./resolve-module.mjs";

const ASSET_RE = /\.(css|scss|svg|png|jpg|json)$/;
const MOCK_TARGET_RE = /vi\.mock\(\s*["']([^"']+)["']/g;
const FACTORY_MOCK_RE = /vi\.mock\(\s*["']([^"']+)["']\s*,/g;
const ARROW_SEARCH_WINDOW = 80;
const EXPORT_DECLARATION_RE =
  /export\s+(?:declare\s+)?(?:async\s+)?(?:const|function|let|var|class|type|interface|enum)\s+([A-Za-z0-9_$]+)/g;
const EXPORT_DESTRUCTURED_RE = /export\s+(?:const|let|var)\s*\{([^}]*)\}\s*=/g;
const EXPORT_LIST_RE = /export\s*(?:type\s*)?\{([^}]*)\}/g;
const EXPORT_STAR_RE = /export\s*\*\s*from\s*["']([^"']+)["']/g;

const specFiles = globSync(["{src,tests}/**/*.{spec,test}.{ts,tsx}", "vitest.setup.ts"], {
  cwd: ROOT,
})
  .map(String)
  .toSorted();

const exportsCache = new Map();

const listedNames = (content, pattern, separator) =>
  [...content.matchAll(pattern)].flatMap((match) =>
    match[1]
      .split(",")
      .map((entry) => entry.trim().split(separator).pop()?.trim())
      .filter(Boolean),
  );

const declaredNames = (content) => [
  ...[...content.matchAll(EXPORT_DECLARATION_RE)].map((match) => match[1]),
  ...listedNames(content, EXPORT_DESTRUCTURED_RE, ":"),
  ...listedNames(content, EXPORT_LIST_RE, /\s+as\s+/),
  ...(/export\s+default\b/.test(content) ? ["default"] : []),
];

const exportsOf = (filePath) => {
  const cached = exportsCache.get(filePath);

  if (cached) return cached;

  const names = new Set();

  exportsCache.set(filePath, names);

  const content = readFileSync(filePath, "utf8");

  for (const name of declaredNames(content)) names.add(name);

  const reExported = [...content.matchAll(EXPORT_STAR_RE)]
    .map((match) => resolveModule(match[1], filePath))
    .filter(Boolean);

  for (const target of reExported) for (const name of exportsOf(target)) names.add(name);

  return names;
};

const lineOf = (content, index) => content.slice(0, index).split("\n").length;

const skipSpace = (content, from) => {
  let cursor = from;

  while (cursor < content.length && /\s/.test(content[cursor])) cursor += 1;

  return cursor;
};

const closingBrace = (content, open) => {
  let depth = 0;

  for (let i = open; i < content.length; i += 1) {
    if (content[i] === "{") depth += 1;

    if (content[i] === "}") depth -= 1;

    if (depth === 0) return i;
  }

  return -1;
};

const objectLiteralAt = (content, open) => {
  const close = closingBrace(content, open);

  return close === -1 ? null : content.slice(open + 1, close);
};

const factoryBodyOf = (content, from) => {
  const arrow = content.indexOf("=>", from);

  if (arrow === -1 || arrow - from > ARROW_SEARCH_WINDOW) return null;

  let cursor = skipSpace(content, arrow + 2);

  const returnsObjectDirectly = content[cursor] === "(";

  if (returnsObjectDirectly) cursor = skipSpace(content, cursor + 1);

  if (content[cursor] !== "{") return null;

  if (returnsObjectDirectly) return objectLiteralAt(content, cursor);

  const close = closingBrace(content, cursor);
  const returned = content.indexOf("return {", cursor);

  if (close === -1 || returned === -1 || returned > close) return null;

  return objectLiteralAt(content, content.indexOf("{", returned));
};

const keysOf = (body) => {
  const lines = body.split("\n").filter((line) => line.trim() !== "");

  if (lines.length === 0) return [];

  const indent = Math.min(...lines.map((line) => line.length - line.trimStart().length));
  const keyAtIndent = new RegExp(`^ {${indent}}([A-Za-z$][\\w$]*)\\s*:`);

  return lines.map((line) => keyAtIndent.exec(line)?.[1]).filter(Boolean);
};

const findings = [];
const unchecked = [];

const checkTargets = (spec, content) => {
  for (const match of content.matchAll(MOCK_TARGET_RE)) {
    const specifier = match[1];

    if (ASSET_RE.test(specifier)) continue;

    if (resolveModule(specifier, path.resolve(ROOT, spec)) === false) {
      findings.push({
        file: spec,
        line: lineOf(content, match.index),
        reason: "module does not exist",
        specifier,
      });
    }
  }
};

const checkFactory = (spec, content, match) => {
  const specifier = match[1];
  const target = resolveModule(specifier, path.resolve(ROOT, spec));

  if (ASSET_RE.test(specifier) || target === false) return;

  const body = factoryBodyOf(content, match.index + match[0].length);
  const line = lineOf(content, match.index);

  if (body === null || target === null) {
    unchecked.push({ file: spec, line, specifier, unreadable: body === null });

    return;
  }

  const real = exportsOf(target);
  const missing = keysOf(body).filter((key) => !real.has(key));

  if (missing.length > 0) {
    findings.push({ file: spec, line, reason: `not exported: ${missing.join(", ")}`, specifier });
  }
};

for (const spec of specFiles) {
  const content = readFileSync(path.resolve(ROOT, spec), "utf8");

  checkTargets(spec, content);

  for (const match of content.matchAll(FACTORY_MOCK_RE)) checkFactory(spec, content, match);
}

const byPlace = (a, b) => a.file.localeCompare(b.file) || a.line - b.line;
const unreadable = unchecked.filter((entry) => entry.unreadable);

if (unchecked.length > 0) {
  console.log(
    `Not checked: ${unchecked.length} mock factories ` +
      `(${unchecked.length - unreadable.length} in packages, ${unreadable.length} unreadable).\n`,
  );

  for (const { file, line, specifier } of unreadable.toSorted(byPlace)) {
    console.log(`${file}:${line}  vi.mock("${specifier}") — factory not read`);
  }

  if (unreadable.length > 0) console.log("");
}

if (findings.length === 0) {
  console.log("No dead mocks found.");
} else {
  console.log(`Dead mocks (${findings.length}):\n`);

  for (const { file, line, reason, specifier } of findings.toSorted(byPlace)) {
    console.log(`${file}:${line}  vi.mock("${specifier}") — ${reason}`);
  }

  process.exit(1);
}
