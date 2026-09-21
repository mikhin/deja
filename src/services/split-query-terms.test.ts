import { describe, expect, it } from "vitest";

import { splitQueryTerms } from "#src/services/split-query-terms.ts";

describe("splitQueryTerms", () => {
  it("lowercases words and drops punctuation", () => {
    expect(splitQueryTerms("Cake Recipe, not a pie!")).toEqual(["cake", "recipe", "not", "pie"]);
  });

  it("drops words shorter than a trigram", () => {
    expect(splitQueryTerms("a to ads bot")).toEqual(["ads", "bot"]);
  });

  it("returns nothing for a query without words", () => {
    expect(splitQueryTerms("?! -- ??")).toEqual([]);
  });
});
