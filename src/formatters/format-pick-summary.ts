import { formatPercent } from "#src/formatters/format-percent.ts";
import type { PickSummary } from "#src/types/pick.ts";

const RECENT_UNRESOLVED = 10;

export function formatPickSummary(summary: PickSummary): string {
  const lines = [
    `searches        ${String(summary.queries)}`,
    `found nothing   ${formatPercent(summary.missShare)}`,
    `opened wrong    ${formatPercent(summary.wrongShare)}`,
    `closed the list ${formatPercent(summary.abandonedShare)}`,
    `not the newest  ${formatPercent(summary.notNewestShare)}`,
    `words dropped   ${formatPercent(summary.degradedShare)}`,
  ];
  const recent = summary.unresolved.slice(-RECENT_UNRESOLVED);

  return recent.length === 0
    ? lines.join("\n")
    : [...lines, "", "recent failures:", ...recent.map((query) => `  ${query}`)].join("\n");
}
