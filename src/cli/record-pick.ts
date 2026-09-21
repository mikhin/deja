import { PICKS_FILE } from "#/cli/paths.ts";
import { appendPick } from "#/services/append-pick.ts";
import type { Pick, PickOutcome } from "#/types/pick.ts";

export function recordPick(query: string, outcome: PickOutcome, extra: Partial<Pick>): void {
  appendPick(PICKS_FILE, { at: new Date().toISOString(), outcome, query, ...extra });
}
