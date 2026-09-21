import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { appendPick } from "#src/services/append-pick.ts";
import { readPicks } from "#src/services/read-picks.ts";
import type { Pick } from "#src/types/pick.ts";

const pick = (query: string): Pick => ({ at: "", outcome: "auto", query });

describe("appendPick", () => {
  it("adds an entry without losing earlier ones", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "deja-picks-"));
    const file = path.join(directory, "picks.jsonl");

    appendPick(file, pick("first"));
    appendPick(file, pick("second"));

    expect(readPicks(file).map((one) => one.query)).toEqual(["first", "second"]);
  });

  it("stays silent when the log cannot be written", () => {
    expect(() => {
      appendPick(path.join(tmpdir(), "deja-missing-dir", "picks.jsonl"), pick("anything"));
    }).not.toThrow();
  });
});
