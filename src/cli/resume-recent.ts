import type { DatabaseSync } from "node:sqlite";
import process from "node:process";

import { chooseSession, FZF_MISSING } from "#/cli/choose-session.ts";
import { openSession } from "#/cli/open-session.ts";
import { printSessions } from "#/cli/print-sessions.ts";
import type { SessionHit } from "#/types/session.ts";

const RECENT_SESSIONS = 30;

export function resumeRecent(database: DatabaseSync, listOnly: boolean): never {
  const recent = database
    .prepare(
      `select sessionId, cwd, title, modifiedAt, 0 score from sessions
       order by modifiedAt desc limit ?`,
    )
    .all(RECENT_SESSIONS) as SessionHit[];

  if (listOnly) {
    printSessions(recent);

    process.exit(0);
  }

  const chosen = chooseSession(recent);

  if (chosen === FZF_MISSING) {
    printSessions(recent);

    process.exit(0);
  }

  if (!chosen) process.exit(0);

  openSession(chosen);
}
