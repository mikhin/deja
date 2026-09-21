import { readFileSync } from "node:fs";
import path from "node:path";

import { knipEntries, resolveModule, ROOT, sourceFiles } from "./resolve-module.mjs";

const SIDE_EFFECT_IMPORT_RE = /import\s+["']([^"']+)["']/g;
const FROM_IMPORT_RE = /(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/g;
const DYNAMIC_IMPORT_RE = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
const IMPORT_PATTERNS = [SIDE_EFFECT_IMPORT_RE, FROM_IMPORT_RE, DYNAMIC_IMPORT_RE];

const KEEP_MARKER = "@dead-code-allow";

const importsOf = (file) => {
  const content = readFileSync(file, "utf8");
  const imports = new Set();

  const specifiers = IMPORT_PATTERNS.flatMap((pattern) =>
    [...content.matchAll(pattern)].map((match) => match[1]),
  );

  for (const specifier of specifiers) {
    const resolved = resolveModule(specifier, file);

    if (resolved) imports.add(resolved);
  }

  return imports;
};

const reachableFrom = (entries, known) => {
  const reachable = new Set();
  const queue = [...entries];

  while (queue.length > 0) {
    const file = queue.pop();

    if (reachable.has(file) || !known.has(file)) continue;

    reachable.add(file);

    for (const dep of importsOf(file)) queue.push(dep);
  }

  return reachable;
};

const keptOnPurpose = (file) => readFileSync(file, "utf8").slice(0, 200).includes(KEEP_MARKER);

const known = new Set(sourceFiles().map((file) => path.resolve(ROOT, file)));
const entries = knipEntries().filter((entry) => known.has(entry));

if (entries.length === 0) {
  console.log("No src entry in knip.json reachable — nothing to walk.");

  process.exit(0);
}

const reachable = reachableFrom(entries, known);
const dead = [...known]
  .filter((file) => !reachable.has(file) && !keptOnPurpose(file))
  .map((file) => path.relative(ROOT, file))
  .toSorted();

if (dead.length === 0) {
  console.log("No dead files.");
} else {
  console.log(
    `Dead files (${dead.length}), unreachable from ${entries.map((e) => path.relative(ROOT, e)).join(", ")}:\n`,
  );

  for (const file of dead) console.log(file);

  process.exit(1);
}
