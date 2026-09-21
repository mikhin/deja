import { describe, expect, it } from "vitest";

import { summarizePicks } from "#/services/summarize-picks.ts";
import type { Pick, PickOutcome } from "#/types/pick.ts";

const pick = (outcome: PickOutcome, query: string, listPosition?: number): Pick => ({
  at: "2026-09-21T00:00:00.000Z",
  outcome,
  query,
  termsKept: 2,
  termsTyped: 2,
  ...(listPosition === undefined ? {} : { listPosition }),
});

describe("summarizePicks", () => {
  it("counts every kind of failure as a share of searches", () => {
    const summary = summarizePicks([
      pick("auto", "watchdog empty", 1),
      pick("miss", "adwords"),
      pick("abandoned", "figma credits"),
      pick("wrong", "stryker"),
    ]);

    expect(summary).toMatchObject({
      abandonedShare: 0.25,
      missShare: 0.25,
      queries: 4,
      wrongShare: 0.25,
    });
  });

  it("measures depth in the list among opened sessions only", () => {
    const summary = summarizePicks([
      pick("auto", "first", 1),
      pick("picked", "second", 4),
      pick("miss", "third"),
    ]);

    expect(summary.notNewestShare).toBe(0.5);
  });

  it("reports no depth when nothing was opened", () => {
    expect(summarizePicks([pick("miss", "adwords")]).notNewestShare).toBe(0);
  });

  it("counts a search whose words were dropped as degraded", () => {
    const degraded: Pick = { ...pick("auto", "stryker mutations", 1), termsKept: 1 };

    expect(summarizePicks([degraded, pick("auto", "watchdog", 1)]).degradedShare).toBe(0.5);
  });

  it("lists failed searches and deep picks, ignoring runs without a query", () => {
    const summary = summarizePicks([
      pick("auto", "found at once", 1),
      pick("picked", "found second", 2),
      pick("picked", "scrolled a lot", 7),
      pick("miss", "found nothing"),
      pick("picked", "", 1),
    ]);

    expect(summary.unresolved).toEqual(["scrolled a lot", "found nothing"]);
    expect(summary.queries).toBe(4);
  });

  it("treats an entry without counters as newest and undegraded", () => {
    const bare: Pick = { at: "", outcome: "picked", query: "no counters" };

    expect(summarizePicks([bare])).toMatchObject({ degradedShare: 0, notNewestShare: 0 });
  });

  it("reports zeroes for an empty log", () => {
    expect(summarizePicks([])).toEqual({
      abandonedShare: 0,
      degradedShare: 0,
      missShare: 0,
      notNewestShare: 0,
      queries: 0,
      unresolved: [],
      wrongShare: 0,
    });
  });
});
