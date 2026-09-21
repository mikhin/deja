import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { markLastPickWrong } from "#src/services/mark-last-pick-wrong.ts";
import { readPicks } from "#src/services/read-picks.ts";

const logOf = (queries: string[]): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "deja-picks-"));
  const file = path.join(directory, "picks.jsonl");

  writeFileSync(
    file,
    queries.map((query) => JSON.stringify({ at: "", outcome: "auto", query })).join("\n"),
  );

  return file;
};

describe("markLastPickWrong", () => {
  it("turns the most recent entry into a wrong one", () => {
    const file = logOf(["first", "last"]);

    expect(markLastPickWrong(file)?.query).toBe("last");
    expect(readPicks(file).map((pick) => pick.outcome)).toEqual(["auto", "wrong"]);
  });

  it("reports nothing to correct on an empty log", () => {
    expect(markLastPickWrong(logOf([]))).toBeUndefined();
  });
});
