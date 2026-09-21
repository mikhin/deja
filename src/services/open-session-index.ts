import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
  create virtual table if not exists transcripts
    using fts5(sessionId unindexed, title, body, tokenize='trigram');
  create table if not exists sessions(
    sessionId text primary key, cwd text, title text, modifiedAt real
  );
`;

export function openSessionIndex(file: string): DatabaseSync {
  const database = new DatabaseSync(file);

  if (!holdsCurrentSchema(database)) {
    database.exec("drop table if exists sessions; drop table if exists transcripts;");
  }

  database.exec(SCHEMA);

  return database;
}

function holdsCurrentSchema(database: DatabaseSync): boolean {
  const columns = database.prepare("select name from pragma_table_info('sessions')").all();

  return columns.length === 0 || columns.some((column) => column["name"] === "sessionId");
}
