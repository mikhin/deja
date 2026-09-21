import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { openSessionIndex } from "#/services/open-session-index.ts";
import { syncSessionIndex } from "#/services/sync-session-index.ts";

const writeTranscript = (
  root: string,
  session: { project: string; sessionId: string },
  text: string,
): string => {
  const dir = path.join(root, session.project);

  mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${session.sessionId}.jsonl`);

  writeFileSync(
    file,
    JSON.stringify({ cwd: `/p/${session.project}`, message: { content: text }, type: "user" }),
  );

  return file;
};

const indexedTitles = (database: ReturnType<typeof openSessionIndex>): unknown[] =>
  database
    .prepare("select title from sessions order by sessionId")
    .all()
    .map((row) => row["title"]);

describe("syncSessionIndex", () => {
  it("indexes every transcript on the first run", () => {
    const root = mkdtempSync(path.join(tmpdir(), "deja-projects-"));
    writeTranscript(root, { project: "bot", sessionId: "one" }, "about bots");
    writeTranscript(root, { project: "web", sessionId: "two" }, "about layout");

    const database = openSessionIndex(":memory:");

    expect(syncSessionIndex(database, root)).toBe(2);
    expect(indexedTitles(database)).toEqual(["about bots", "about layout"]);
  });

  it("skips files whose modification time did not change", () => {
    const root = mkdtempSync(path.join(tmpdir(), "deja-projects-"));
    writeTranscript(root, { project: "bot", sessionId: "one" }, "about bots");

    const database = openSessionIndex(":memory:");

    syncSessionIndex(database, root);

    expect(syncSessionIndex(database, root)).toBe(0);
  });

  it("reindexes a session that was written to again", () => {
    const root = mkdtempSync(path.join(tmpdir(), "deja-projects-"));
    const file = writeTranscript(root, { project: "bot", sessionId: "one" }, "about bots");
    const database = openSessionIndex(":memory:");

    syncSessionIndex(database, root);
    writeTranscript(root, { project: "bot", sessionId: "one" }, "now about the watchdog");
    utimesSync(file, new Date(), new Date(Date.now() + 1000));

    expect(syncSessionIndex(database, root)).toBe(1);
    expect(indexedTitles(database)).toEqual(["now about the watchdog"]);
  });

  it("forgets a session whose transcript was deleted", () => {
    const root = mkdtempSync(path.join(tmpdir(), "deja-projects-"));
    const file = writeTranscript(root, { project: "bot", sessionId: "one" }, "about bots");
    const database = openSessionIndex(":memory:");

    syncSessionIndex(database, root);
    rmSync(file);

    expect(syncSessionIndex(database, root)).toBe(1);
    expect(indexedTitles(database)).toEqual([]);
  });

  it("ignores transcripts the user never wrote in and stray files", () => {
    const root = mkdtempSync(path.join(tmpdir(), "deja-projects-"));
    mkdirSync(path.join(root, "empty"), { recursive: true });
    writeFileSync(path.join(root, "empty", "silent.jsonl"), JSON.stringify({ type: "assistant" }));
    writeFileSync(path.join(root, "empty", "notes.txt"), "unrelated");
    writeFileSync(path.join(root, "loose.jsonl"), "outside any project");

    const database = openSessionIndex(":memory:");

    expect(syncSessionIndex(database, root)).toBe(1);
    expect(indexedTitles(database)).toEqual([]);
  });
});
