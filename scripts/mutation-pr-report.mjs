import { execFileSync } from "node:child_process";
import fs from "node:fs";

const MARKER = "<!-- mutation-report -->";
const SURVIVING = new Set(["NoCoverage", "Survived"]);
const MAX_PER_FILE = 12;
const SNIPPET_WIDTH = 90;
const REPLACEMENT_WIDTH = 60;

const [baseRef = "origin/main", reportPath = "reports/mutation/mutation.json"] =
  process.argv.slice(2);

const changedLines = (file) => {
  const diff = execFileSync("git", ["diff", "--unified=0", `${baseRef}...HEAD`, "--", file], {
    encoding: "utf8",
  });
  const lines = new Set();

  for (const hunk of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(hunk[1]);
    const count = hunk[2] === undefined ? 1 : Number(hunk[2]);

    for (let line = start; line < start + count; line++) lines.add(line);
  }

  return lines;
};

const truncateMiddle = (text, max) => {
  const flat = text.replaceAll(/\s+/g, " ").trim();

  if (flat.length <= max) return flat;

  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);

  return `${flat.slice(0, head)}…${flat.slice(-tail)}`;
};

const describe = (mutant, sourceLines) => {
  const { end, start } = mutant.location;
  const lines = end.line > start.line ? `L${start.line}-${end.line}` : `L${start.line}`;
  const original = truncateMiddle(
    sourceLines.slice(start.line - 1, end.line).join(" "),
    SNIPPET_WIDTH,
  );
  const replacement = truncateMiddle(mutant.replacement ?? "", REPLACEMENT_WIDTH) || "(removed)";
  const label = mutant.status === "NoCoverage" ? " *(no test runs it)*" : "";

  return `- **${lines}** \`${mutant.mutatorName}\`${label}\n  \`${original}\` → \`${replacement}\``;
};

const list = (mutants, sourceLines) =>
  mutants
    .slice(0, MAX_PER_FILE)
    .map((m) => describe(m, sourceLines))
    .join("\n");

const overflow = (mutants, suffix) =>
  mutants.length > MAX_PER_FILE ? `_…and ${mutants.length - MAX_PER_FILE} more${suffix}._` : "";

const fileSection = (file, data) => {
  const survivors = data.mutants.filter((m) => SURVIVING.has(m.status));

  if (survivors.length === 0) return null;

  const sourceLines = (data.source ?? "").split("\n");
  const touched = changedLines(file);
  const inDiff = survivors.filter((m) => touched.has(m.location.start.line));
  const rest = survivors.filter((m) => !touched.has(m.location.start.line));
  const body = [`**\`${file}\`**`];

  if (inDiff.length > 0) {
    body.push(list(inDiff, sourceLines), overflow(inDiff, " on changed lines"));
  }

  if (rest.length > 0) {
    body.push(
      `<details><summary>Show ${rest.length}</summary>\n\n${list(rest, sourceLines)}\n\n${overflow(rest, "")}\n\n</details>`,
    );
  }

  return { inDiff: inDiff.length, rest: rest.length, text: body.filter(Boolean).join("\n\n") };
};

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const sections = Object.entries(report.files)
  .map(([file, data]) => fileSection(file, data))
  .filter(Boolean);
const insideDiff = sections.reduce((sum, s) => sum + s.inDiff, 0);
const elsewhere = sections.reduce((sum, s) => sum + s.rest, 0);
const plural = (n, one, many) => (n === 1 ? one : many);

const lines = [MARKER, "### Mutation testing"];

if (sections.length === 0) {
  lines.push(
    "Every mutant in the files you touched was killed: the tests notice each of those lines breaking.",
  );
} else {
  const headline =
    insideDiff > 0
      ? `**${insideDiff} surviving ${plural(insideDiff, "mutant", "mutants")} on lines you changed.**`
      : "**No survivors on the lines you changed.**";
  const tail =
    elsewhere > 0
      ? ` ${elsewhere} more ${plural(elsewhere, "survives", "survive")} elsewhere in the same files (folded below).`
      : "";

  lines.push(
    `${headline}${tail}`,
    "",
    "Each entry is a change to your code that no test would catch. Equivalent mutants, rewrites that cannot alter behaviour, are fine to ignore. Nothing here blocks the merge.",
    "",
    sections.map((s) => s.text).join("\n\n"),
  );
}

process.stdout.write(`${lines.join("\n")}\n`);
