import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseSync } from "oxc-parser";

import { isDirective } from "./comment-directives.cjs";

const SOURCE_PATTERNS = ["*.ts", "*.tsx", "*.mts", "*.cts", "*.js", "*.mjs", "*.cjs"];

const trackedSourceFiles = (roots) => {
  const patterns = SOURCE_PATTERNS.map((pattern) => `'${pattern}'`).join(" ");
  const files = execSync(`git ls-files ${patterns}`, { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

  if (roots.length === 0) return files;

  return files.filter((file) => roots.some((root) => file === root || file.startsWith(`${root}/`)));
};

const enclosingJsxBraces = (text, start, end) => {
  const before = text.slice(0, start).trimEnd();
  const after = text.slice(end).trimStart();

  if (!before.endsWith("{") || !after.startsWith("}")) return null;

  return [before.length - 1, text.length - after.length + 1];
};

const commentRanges = (file, text) => {
  const { comments } = parseSync(file, text);
  const ranges = [];

  let kept = 0;

  for (const comment of comments) {
    if (isDirective(text.slice(comment.start, comment.end))) {
      kept += 1;

      continue;
    }

    const jsx = enclosingJsxBraces(text, comment.start, comment.end);

    ranges.push(jsx ?? [comment.start, comment.end]);
  }

  return { kept, ranges };
};

const whitespaceAround = (text, start, end) => {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = text.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  const before = text.slice(lineStart, start);
  const after = text.slice(end, lineEnd);

  return {
    leading: after.length - after.trimStart().length,
    lineEnd,
    lineStart,
    onlySpaceAfter: /^\s*$/.test(after),
    onlySpaceBefore: /^\s*$/.test(before),
    trailing: before.length - before.trimEnd().length,
  };
};

const removeRange = (text, [start, end]) => {
  const around = whitespaceAround(text, start, end);

  if (around.onlySpaceBefore && around.onlySpaceAfter) {
    const cut = around.lineEnd === text.length ? around.lineEnd : around.lineEnd + 1;

    return text.slice(0, around.lineStart) + text.slice(cut);
  }

  if (around.onlySpaceAfter) return text.slice(0, start - around.trailing) + text.slice(end);

  if (around.onlySpaceBefore) {
    return text.slice(0, around.lineStart) + text.slice(end + around.leading);
  }

  return `${text.slice(0, start - around.trailing)} ${text.slice(end + around.leading)}`;
};

const stripFile = (file, dryRun) => {
  const text = fs.readFileSync(file, "utf8");
  const { kept, ranges } = commentRanges(file, text);

  if (ranges.length === 0) return { changed: false, kept, removed: 0 };

  let stripped = text;

  for (const range of ranges.toSorted(([a], [b]) => b - a)) stripped = removeRange(stripped, range);

  if (!dryRun && stripped !== text) fs.writeFileSync(file, stripped);

  return { changed: stripped !== text, kept, removed: ranges.length };
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const roots = args
  .filter((arg) => !arg.startsWith("--"))
  .map((arg) => path.normalize(arg).replace(/\/$/, ""));
const files = trackedSourceFiles(roots);
const totals = { changed: 0, kept: 0, removed: 0 };

for (const file of files) {
  const result = stripFile(file, dryRun);

  totals.removed += result.removed;

  totals.kept += result.kept;

  if (result.changed) {
    totals.changed += 1;

    console.log(`${dryRun ? "Would strip" : "Stripped"}: ${file}`);
  }
}

console.log(
  `\n${files.length} files scanned, ${totals.changed} ${dryRun ? "to change" : "changed"}, ` +
    `${totals.removed} comments ${dryRun ? "to remove" : "removed"}, ${totals.kept} directives kept`,
);
