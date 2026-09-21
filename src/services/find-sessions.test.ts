import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import { findSessions } from "#/services/find-sessions.ts";
import { openSessionIndex } from "#/services/open-session-index.ts";

type Seed = { body: string; sessionId: string; title: string };

const indexOf = (rows: Seed[]): DatabaseSync => {
  const database = openSessionIndex(":memory:");
  const rememberTranscript = database.prepare("insert into transcripts values(?, ?, ?)");
  const rememberSession = database.prepare("insert into sessions values(?, ?, ?, ?)");

  for (const [index, row] of rows.entries()) {
    rememberTranscript.run(row.sessionId, row.title, row.body);
    rememberSession.run(row.sessionId, "/p", row.title, index);
  }

  return database;
};

describe("findSessions", () => {
  it("matches another form of the typed word", () => {
    const database = indexOf([
      { body: "we baked a honey cake", sessionId: "cake", title: "Honey" },
    ]);

    const found = findSessions(database, "cakes recipe", 5);

    expect(found.hits.map((hit) => hit.sessionId)).toEqual(["cake"]);
    expect(found.terms).toEqual(["cake"]);
  });

  it("shortens the word that has other forms rather than the longest one", () => {
    const database = indexOf([
      { body: "cleaning up empty files", sessionId: "files", title: "Empty results" },
      { body: "the bot returns nothing", sessionId: "wd", title: "Watchdog empty result" },
    ]);

    const found = findSessions(database, "watchdog results", 5);

    expect(found.hits.map((hit) => hit.sessionId)).toEqual(["wd"]);
    expect(found.terms).toEqual(["watchdog", "result"]);
  });

  it("ignores a word the corpus never mentions and searches on the rest", () => {
    const database = indexOf([
      { body: "a bot about a bank card", sessionId: "card", title: "Card chat" },
      { body: "bot monitoring empty answers", sessionId: "wd", title: "Watchdog" },
    ]);

    const found = findSessions(database, "telegram bot monitoring", 5);

    expect(found.hits.map((hit) => hit.sessionId)).toEqual(["wd"]);
    expect(found.terms).toEqual(["bot", "monitoring"]);
  });

  it("finds a three-letter word, the shortest a trigram index can match", () => {
    const database = indexOf([
      { body: "the ads api returns quota errors", sessionId: "quota", title: "Ads API" },
      { body: "the honey cake layers came out dry", sessionId: "cake", title: "Honey cake" },
    ]);

    const found = findSessions(database, "ads", 5);

    expect(found.hits.map((hit) => hit.sessionId)).toEqual(["quota"]);
    expect(found.terms).toEqual(["ads"]);
  });

  it("drops one of two words that never appear in the same session", () => {
    const database = indexOf([
      { body: "linter rules", sessionId: "lint", title: "oxlint" },
      { body: "browser tests", sessionId: "e2e", title: "playwright" },
    ]);

    const found = findSessions(database, "oxlint playwright", 5);

    expect(found.hits.map((hit) => hit.sessionId)).toEqual(["e2e"]);
    expect(found.terms).toEqual(["playwright"]);
  });

  it("ranks a title match above the same word buried in the body", () => {
    const database = indexOf([
      { body: "oxlint oxlint oxlint", sessionId: "body", title: "Something else" },
      { body: "short", sessionId: "title", title: "oxlint rules" },
    ]);

    expect(findSessions(database, "oxlint", 5).hits[0]?.sessionId).toBe("title");
  });

  it("returns nothing when no word survives", () => {
    const database = indexOf([{ body: "a honey cake", sessionId: "cake", title: "Honey" }]);

    expect(findSessions(database, "adwords", 5)).toEqual({ hits: [], terms: [] });
  });

  it("returns nothing for a query without searchable words", () => {
    const database = indexOf([{ body: "a honey cake", sessionId: "cake", title: "Honey" }]);

    expect(findSessions(database, "?!", 5).hits).toEqual([]);
  });

  it("escapes quotes so a quoted query cannot break the match", () => {
    const database = indexOf([{ body: 'he said "done"', sessionId: "quoted", title: "Quote" }]);

    const found = findSessions(database, '"done"', 5);

    expect(found.hits.map((hit) => hit.sessionId)).toEqual(["quoted"]);
  });
});
