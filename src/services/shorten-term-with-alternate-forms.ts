export function shortenTermWithAlternateForms(
  terms: string[],
  countDocuments: (candidate: string) => number,
  minLength: number,
): string[] | undefined {
  const candidates = terms.map((term, index) => {
    if (term.length <= minLength) return { extraDocuments: 0, shortened: terms };

    const shorter = term.slice(0, -1);

    return {
      extraDocuments: countDocuments(shorter) - countDocuments(term),
      shortened: terms.with(index, shorter),
    };
  });
  const best = candidates.reduce((one, other) =>
    other.extraDocuments > one.extraDocuments ? other : one,
  );

  return best.extraDocuments > 0 ? best.shortened : undefined;
}
