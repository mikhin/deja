import { describe, expect, it } from "vitest";

import { formatPickSummary } from "#/formatters/format-pick-summary.ts";
import type { PickSummary } from "#/types/pick.ts";

const summary = (fields: Partial<PickSummary>): PickSummary => ({
  abandonedShare: 0,
  degradedShare: 0,
  missShare: 0,
  notNewestShare: 0,
  queries: 0,
  unresolved: [],
  wrongShare: 0,
  ...fields,
});

describe("formatPickSummary", () => {
  it("rounds shares to whole percent", () => {
    const text = formatPickSummary(summary({ missShare: 1 / 3, queries: 3 }));

    expect(text).toContain("found nothing   33%");
    expect(text).toContain("searches        3");
  });

  it("omits the tail when every search resolved", () => {
    expect(formatPickSummary(summary({ queries: 2 }))).not.toContain("recent failures");
  });

  it("shows only the last ten unresolved searches", () => {
    const unresolved = Array.from({ length: 12 }, (_, index) => `search ${String(index)}`);
    const text = formatPickSummary(summary({ queries: 12, unresolved }));

    expect(text).toContain("search 11");
    expect(text).not.toContain("search 1\n");
  });
});
