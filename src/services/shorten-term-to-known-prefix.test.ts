import { describe, expect, it } from "vitest";

import { shortenTermToKnownPrefix } from "#/services/shorten-term-to-known-prefix.ts";

const corpus =
  (known: string[]) =>
  (candidate: string): number =>
    known.filter((word) => word.includes(candidate)).length;

describe("shortenTermToKnownPrefix", () => {
  it("keeps a term the corpus already contains", () => {
    expect(shortenTermToKnownPrefix("result", corpus(["result"]), 4)).toBe("result");
  });

  it("cuts the ending until the prefix appears in the corpus", () => {
    expect(shortenTermToKnownPrefix("results", corpus(["an empty result"]), 4)).toBe("result");
  });

  it("gives up on a word the corpus never mentions", () => {
    expect(shortenTermToKnownPrefix("telegram", corpus(["watchdog"]), 4)).toBeUndefined();
  });

  it("never shortens below the minimum length", () => {
    expect(shortenTermToKnownPrefix("flak", corpus(["flame"]), 4)).toBeUndefined();
  });
});
