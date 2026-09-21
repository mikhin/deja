import type { SessionHit } from "#/types/session.ts";

const DATE_LENGTH = 10;
const PROJECT_WIDTH = 22;
const TITLE_WIDTH = 70;

export function formatSessionRow(hit: SessionHit): string {
  const day = new Date(hit.modifiedAt).toISOString().slice(0, DATE_LENGTH);
  const project = hit.cwd.split("/").findLast(Boolean) ?? "?";

  return [
    hit.sessionId,
    day,
    project.padEnd(PROJECT_WIDTH).slice(0, PROJECT_WIDTH),
    hit.title.slice(0, TITLE_WIDTH),
  ].join("\t");
}
