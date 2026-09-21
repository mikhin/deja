import type { DatabaseSync, StatementSync } from "node:sqlite";
import { statSync } from "node:fs";

import { listTranscriptFiles } from "#src/services/list-transcript-files.ts";
import { parseSessionFile } from "#src/services/parse-session-file.ts";

type Statements = {
  forgetSession: StatementSync;
  forgetTranscript: StatementSync;
  rememberSession: StatementSync;
  rememberTranscript: StatementSync;
};

type Transcript = { file: string; modifiedAt: number; sessionId: string };

export function syncSessionIndex(database: DatabaseSync, root: string): number {
  const statements = statementsOf(database);
  const indexed = indexedTimes(database);
  const transcripts = listTranscriptFiles(root).map((one) => ({
    ...one,
    modifiedAt: statSync(one.file).mtimeMs,
  }));
  const present = new Set(transcripts.map((one) => one.sessionId));
  const stale = transcripts.filter((one) => indexed.get(one.sessionId) !== one.modifiedAt);
  const removed = [...indexed.keys()].filter((sessionId) => !present.has(sessionId));

  for (const one of stale) reindex(statements, one);

  for (const sessionId of removed) forget(statements, sessionId);

  return stale.length + removed.length;
}

function forget(statements: Statements, sessionId: string): void {
  statements.forgetSession.run(sessionId);

  statements.forgetTranscript.run(sessionId);
}

function indexedTimes(database: DatabaseSync): Map<string, number> {
  const rows = database.prepare("select sessionId, modifiedAt from sessions").all();

  return new Map(rows.map((row) => [String(row["sessionId"]), Number(row["modifiedAt"])]));
}

function reindex(statements: Statements, transcript: Transcript): void {
  const { file, modifiedAt, sessionId } = transcript;
  const content = parseSessionFile(file);

  forget(statements, sessionId);

  if (!content) return;

  statements.rememberSession.run(sessionId, content.cwd, content.title, modifiedAt);

  statements.rememberTranscript.run(sessionId, content.title, content.body);
}

function statementsOf(database: DatabaseSync): Statements {
  return {
    forgetSession: database.prepare("delete from sessions where sessionId = ?"),
    forgetTranscript: database.prepare("delete from transcripts where sessionId = ?"),
    rememberSession: database.prepare("insert into sessions values(?, ?, ?, ?)"),
    rememberTranscript: database.prepare("insert into transcripts values(?, ?, ?)"),
  };
}
