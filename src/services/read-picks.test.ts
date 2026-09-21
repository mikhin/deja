import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { readPicks } from "#src/services/read-picks.ts";

const logOf = (lines: string[]): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "deja-picks-"));
  const file = path.join(directory, "picks.jsonl");

  writeFileSync(file, lines.join("\n"));

  return file;
};

describe("readPicks", () => {
  it("reads a complete entry", () => {
    const entry = {
      at: "2026-09-21T00:00:00.000Z",
      listPosition: 2,
      outcome: "picked",
      query: "watchdog",
      termsKept: 1,
      termsTyped: 2,
    };

    const file = logOf([JSON.stringify(entry)]);

    expect(readPicks(file)).toEqual([entry]);
  });

  it("omits counters the entry does not carry", () => {
    const file = logOf([JSON.stringify({ outcome: "miss", query: "adwords" })]);

    const picks = readPicks(file);

    expect(picks).toEqual([{ at: "", outcome: "miss", query: "adwords" }]);
  });

  it("skips broken lines and entries without an outcome or query", () => {
    const file = logOf([
      "{incomplete",
      JSON.stringify([1, 2]),
      JSON.stringify({ outcome: "danced", query: "x" }),
      JSON.stringify({ outcome: "miss" }),
      JSON.stringify({ outcome: "miss", query: "survived" }),
      "",
    ]);

    expect(readPicks(file).map((one) => one.query)).toEqual(["survived"]);
  });

  it("treats a missing log as no history", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "deja-picks-"));
    const missing = path.join(directory, "never-written.jsonl");

    expect(readPicks(missing)).toEqual([]);
  });
});
