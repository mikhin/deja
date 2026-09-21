import { describe, expect, it } from "vitest";

import { shortenTermWithAlternateForms } from "#/services/shorten-term-with-alternate-forms.ts";

const documents: Record<string, number> = {
  answer: 5,
  answers: 3,
  result: 15,
  results: 7,
  watchdo: 2,
  watchdog: 2,
};

const countDocuments = (term: string): number => documents[term] ?? 0;

describe("shortenTermWithAlternateForms", () => {
  it("shortens the term whose shorter prefix appears in more sessions", () => {
    expect(shortenTermWithAlternateForms(["watchdog", "results"], countDocuments, 4)).toEqual([
      "watchdog",
      "result",
    ]);
  });

  it("prefers the term that gains the most sessions", () => {
    expect(shortenTermWithAlternateForms(["answers", "results"], countDocuments, 4)).toEqual([
      "answers",
      "result",
    ]);
  });

  it("reports nothing when shortening adds no sessions", () => {
    expect(shortenTermWithAlternateForms(["watchdog"], countDocuments, 4)).toBeUndefined();
  });

  it("leaves terms already at the minimum length alone", () => {
    expect(shortenTermWithAlternateForms(["flak"], countDocuments, 4)).toBeUndefined();
  });
});
