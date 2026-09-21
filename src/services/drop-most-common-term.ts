export function dropMostCommonTerm(
  terms: string[],
  countDocuments: (candidate: string) => number,
): string[] {
  const documents = terms.map((term) => countDocuments(term));
  const mostCommon = documents.indexOf(Math.max(...documents));

  return terms.filter((_, index) => index !== mostCommon);
}
