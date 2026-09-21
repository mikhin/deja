import { describe, expect, it } from "vitest";

import { dropMostCommonTerm } from "#src/services/drop-most-common-term.ts";

const documents: Record<string, number> = { monitoring: 1, session: 120, telegram: 0 };

const countDocuments = (term: string): number => documents[term] ?? 0;

describe("dropMostCommonTerm", () => {
  it("removes the term that matches the most sessions", () => {
    expect(dropMostCommonTerm(["telegram", "session", "monitoring"], countDocuments)).toEqual([
      "telegram",
      "monitoring",
    ]);
  });

  it("removes only the first of equally common terms", () => {
    expect(dropMostCommonTerm(["session", "session"], countDocuments)).toEqual(["session"]);
  });
});
