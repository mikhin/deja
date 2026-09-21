import { formatSessionRow } from "#/formatters/format-session-row.ts";
import type { SessionHit } from "#/types/session.ts";

export function printSessions(hits: SessionHit[]): void {
  for (const hit of hits) {
    console.log(formatSessionRow(hit).split("\t").slice(1).join("  "));
  }
}
