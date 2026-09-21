import { describe, expect, it } from "vitest";

import { sortByRecency } from "#/services/sort-by-recency.ts";
import type { SessionHit } from "#/types/session.ts";

const hit = (sessionId: string, modifiedAt: number, score: number): SessionHit => ({
  cwd: "/p",
  modifiedAt,
  score,
  sessionId,
  title: sessionId,
});

describe("sortByRecency", () => {
  it("puts the newest session first regardless of its relevance", () => {
    const sorted = sortByRecency([hit("old", 100, -9), hit("new", 300, -1), hit("mid", 200, -5)]);

    expect(sorted.map((one) => one.sessionId)).toEqual(["new", "mid", "old"]);
  });

  it("leaves the given list untouched", () => {
    const given = [hit("old", 100, -9), hit("new", 300, -1)];

    sortByRecency(given);

    expect(given.map((one) => one.sessionId)).toEqual(["old", "new"]);
  });
});
