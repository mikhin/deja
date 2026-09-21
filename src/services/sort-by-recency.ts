import type { SessionHit } from "#src/types/session.ts";

export function sortByRecency(hits: SessionHit[]): SessionHit[] {
  return hits.toSorted((one, other) => other.modifiedAt - one.modifiedAt);
}
