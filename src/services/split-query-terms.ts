const WORD = /[\p{L}\p{N}]{3,}/gu;

export function splitQueryTerms(query: string): string[] {
  return [...query.toLowerCase().matchAll(WORD)].map((match) => match[0]);
}
