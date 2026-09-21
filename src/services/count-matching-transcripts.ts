import type { DatabaseSync } from "node:sqlite";

export function countMatchingTranscripts(database: DatabaseSync): (match: string) => number {
  const documents = database.prepare(
    "select count(*) n from transcripts where transcripts match ?",
  );

  return (match: string): number => Number((documents.get(match) as { n: number }).n);
}
