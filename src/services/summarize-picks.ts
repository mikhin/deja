import type { Pick, PickSummary } from "#src/types/pick.ts";

const NEWEST = 1;
const LISTED_DEEP = 3;

export function summarizePicks(picks: Pick[]): PickSummary {
  const searches = picks.filter((pick) => pick.query !== "");
  const found = searches.filter(opened);
  const countOf = (outcome: Pick["outcome"]): number =>
    searches.filter((pick) => pick.outcome === outcome).length;

  return {
    abandonedShare: share(countOf("abandoned"), searches.length),
    degradedShare: share(
      searches.filter((pick) => (pick.termsKept ?? 0) < (pick.termsTyped ?? 0)).length,
      searches.length,
    ),
    missShare: share(countOf("miss"), searches.length),
    notNewestShare: share(found.filter((pick) => positionOf(pick) > NEWEST).length, found.length),
    queries: searches.length,
    unresolved: searches.filter((pick) => !resolved(pick)).map((pick) => pick.query),
    wrongShare: share(countOf("wrong"), searches.length),
  };
}

function opened(pick: Pick): boolean {
  return pick.outcome === "auto" || pick.outcome === "picked";
}

function positionOf(pick: Pick): number {
  return pick.listPosition ?? NEWEST;
}

function resolved(pick: Pick): boolean {
  return pick.outcome === "auto" || (pick.outcome === "picked" && positionOf(pick) <= LISTED_DEEP);
}

function share(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}
