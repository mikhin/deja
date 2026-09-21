const PERCENT = 100;

export function formatPercent(share: number): string {
  return `${String(Math.round(share * PERCENT))}%`;
}
