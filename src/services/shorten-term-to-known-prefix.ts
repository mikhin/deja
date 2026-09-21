export function shortenTermToKnownPrefix(
  term: string,
  countDocuments: (candidate: string) => number,
  minLength: number,
): string | undefined {
  for (let length = term.length; length >= minLength; length -= 1) {
    const prefix = term.slice(0, length);

    if (countDocuments(prefix) > 0) return prefix;
  }

  return undefined;
}
