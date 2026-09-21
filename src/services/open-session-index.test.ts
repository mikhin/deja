import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import { openSessionIndex } from "#/services/open-session-index.ts";

describe("openSessionIndex", () => {
  it("creates the tables a fresh index needs", () => {
    const database = openSessionIndex(":memory:");

    database.prepare("insert into sessions values(?, ?, ?, ?)").run("one", "/p", "Topic", 1);
    database.prepare("insert into transcripts values(?, ?, ?)").run("one", "Topic", "body text");

    expect(database.prepare("select title from sessions").get()?.["title"]).toBe("Topic");
  });

  it("rebuilds an index left over from an older schema", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "deja-index-"));
    const file = path.join(directory, "index.db");
    const stale = new DatabaseSync(file);

    stale.exec("create table sessions(sid text primary key, cwd text, title text, mtime real)");
    stale.prepare("insert into sessions values(?, ?, ?, ?)").run("one", "/p", "Older", 1);
    stale.close();

    const database = openSessionIndex(file);

    expect(database.prepare("select count(*) n from sessions").get()?.["n"]).toBe(0);
  });

  it("reopens an existing index without losing what it holds", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "deja-index-"));
    const file = path.join(directory, "index.db");

    openSessionIndex(file)
      .prepare("insert into sessions values(?, ?, ?, ?)")
      .run("one", "/p", "Topic", 1);

    expect(openSessionIndex(file).prepare("select count(*) n from sessions").get()?.["n"]).toBe(1);
  });
});
