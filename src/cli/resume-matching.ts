import type { DatabaseSync } from "node:sqlite";
import process from "node:process";

import { chooseSession, FZF_MISSING } from "#src/cli/choose-session.ts";
import { openSession } from "#src/cli/open-session.ts";
import { printSessions } from "#src/cli/print-sessions.ts";
import { recordPick } from "#src/cli/record-pick.ts";
import { findSessions } from "#src/services/find-sessions.ts";
import { sortByRecency } from "#src/services/sort-by-recency.ts";
import { splitQueryTerms } from "#src/services/split-query-terms.ts";

const CANDIDATES = 20;
const FAILURE = 1;

export function resumeMatching(database: DatabaseSync, query: string, listOnly: boolean): never {
  const { hits, terms } = findSessions(database, query, CANDIDATES);
  const counted = { termsKept: terms.length, termsTyped: splitQueryTerms(query).length };

  if (hits.length === 0) {
    recordPick(query, "miss", counted);

    console.error(`nothing about "${query}"`);

    process.exit(FAILURE);
  }

  if (counted.termsKept < counted.termsTyped) {
    console.error(`searched "${terms.join(" ")}" — the rest never appears alongside it`);
  }

  const listed = sortByRecency(hits);

  if (listOnly) {
    printSessions(listed);

    process.exit(0);
  }

  const only = listed.length === 1 ? listed[0] : undefined;

  if (only) {
    recordPick(query, "auto", { ...counted, listPosition: 1 });

    openSession(only);
  }

  const chosen = chooseSession(listed);

  if (chosen === FZF_MISSING) {
    printSessions(listed);

    process.exit(0);
  }

  if (!chosen) {
    recordPick(query, "abandoned", counted);

    process.exit(FAILURE);
  }

  recordPick(query, "picked", { ...counted, listPosition: listed.indexOf(chosen) + 1 });

  openSession(chosen);
}
