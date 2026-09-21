import { PICKS_FILE } from "#src/cli/paths.ts";
import { appendPick } from "#src/services/append-pick.ts";
import type { Pick, PickOutcome } from "#src/types/pick.ts";

export function recordPick(query: string, outcome: PickOutcome, extra: Partial<Pick>): void {
  appendPick(PICKS_FILE, { at: new Date().toISOString(), outcome, query, ...extra });
}
