#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import process from "node:process";

import { CACHE, INDEX_FILE, PICKS_FILE, TRANSCRIPTS } from "#/cli/paths.ts";
import { resumeMatching } from "#/cli/resume-matching.ts";
import { resumeRecent } from "#/cli/resume-recent.ts";
import { formatPickSummary } from "#/formatters/format-pick-summary.ts";
import { markLastPickWrong } from "#/services/mark-last-pick-wrong.ts";
import { openSessionIndex } from "#/services/open-session-index.ts";
import { readPicks } from "#/services/read-picks.ts";
import { summarizePicks } from "#/services/summarize-picks.ts";
import { syncSessionIndex } from "#/services/sync-session-index.ts";

function run(): never {
  mkdirSync(CACHE, { recursive: true });

  const args = process.argv.slice(2);
  const flags = new Set(args.filter((argument) => argument.startsWith("-")));
  const query = args.filter((argument) => !argument.startsWith("-")).join(" ");

  if (flags.has("--wrong")) {
    const corrected = markLastPickWrong(PICKS_FILE);

    console.log(
      corrected ? `noted: "${corrected.query}" opened the wrong one` : "nothing to correct",
    );

    process.exit(0);
  }

  if (flags.has("--stats")) {
    const picks = readPicks(PICKS_FILE);

    console.log(formatPickSummary(summarizePicks(picks)));

    process.exit(0);
  }

  const database = openSessionIndex(INDEX_FILE);
  const changed = syncSessionIndex(database, TRANSCRIPTS);

  if (flags.has("--reindex")) {
    console.log(`reindexed sessions: ${String(changed)}`);

    process.exit(0);
  }

  const listOnly = flags.has("-l") || flags.has("--list");

  if (query) resumeMatching(database, query, listOnly);

  resumeRecent(database, listOnly);
}

run();
