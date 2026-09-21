import type { DatabaseSync } from "node:sqlite";

import { countMatchingTranscripts } from "#/services/count-matching-transcripts.ts";
import { dropMostCommonTerm } from "#/services/drop-most-common-term.ts";
import { shortenTermToKnownPrefix } from "#/services/shorten-term-to-known-prefix.ts";
import { shortenTermWithAlternateForms } from "#/services/shorten-term-with-alternate-forms.ts";
import { splitQueryTerms } from "#/services/split-query-terms.ts";
import type { SessionHit } from "#/types/session.ts";

const SHORTEST_PREFIX = 4;
const TITLE_WEIGHT = 10;
const BODY_WEIGHT = 1;

const SEARCH = `
  select t.sessionId sessionId, s.cwd cwd, s.title title, s.modifiedAt modifiedAt,
    bm25(transcripts, 0, ${String(TITLE_WEIGHT)}, ${String(BODY_WEIGHT)}) score
  from transcripts t join sessions s using(sessionId)
  where transcripts match ? order by score, s.modifiedAt desc limit ?
`;

export function findSessions(
  database: DatabaseSync,
  query: string,
  limit: number,
): { hits: SessionHit[]; terms: string[] } {
  const search = database.prepare(SEARCH);
  const matching = countMatchingTranscripts(database);
  const countDocuments = (term: string): number => matching(asSubstringMatch(term));

  let terms = splitQueryTerms(query)
    .map((term) => shortenTermToKnownPrefix(term, countDocuments, SHORTEST_PREFIX))
    .filter((term) => term !== undefined);

  while (terms.length > 0) {
    const hits = search.all(terms.map(asSubstringMatch).join(" AND "), limit) as SessionHit[];

    if (hits.length > 0) return { hits, terms };

    terms =
      shortenTermWithAlternateForms(terms, countDocuments, SHORTEST_PREFIX) ??
      dropMostCommonTerm(terms, countDocuments);
  }

  return { hits: [], terms: [] };
}

function asSubstringMatch(term: string): string {
  return `"${term.replaceAll('"', '""')}"`;
}
