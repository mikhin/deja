const OPENING = "<command-args>";
const CLOSING = "</command-args>";

export function extractSlashCommandArguments(text: string): string[] {
  const parts: string[] = [];

  let cursor = 0;

  for (;;) {
    const start = text.indexOf(OPENING, cursor);

    if (start === -1) return parts;

    const end = text.indexOf(CLOSING, start + OPENING.length);

    if (end === -1) return parts;

    parts.push(text.slice(start + OPENING.length, end).trim());

    cursor = end + CLOSING.length;
  }
}
