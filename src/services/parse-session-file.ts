import { readFileSync } from "node:fs";

import { extractUserMessages } from "#src/services/extract-user-messages.ts";
import { isPlainObject } from "#src/services/is-plain-object.ts";
import { parseJsonLine } from "#src/services/parse-json-line.ts";
import type { SessionContent } from "#src/types/session.ts";

const TITLE_FROM_FIRST_MESSAGE = 120;

type Written = { line: Record<string, unknown>; messages: string[] };

export function parseSessionFile(file: string): SessionContent | undefined {
  const written: Written[] = readFileSync(file, "utf8")
    .split("\n")
    .map((line) => parseJsonLine(line))
    .filter((line) => isPlainObject(line))
    .map((line) => ({ line, messages: extractUserMessages(line) }));
  const messages = written.flatMap((one) => one.messages);
  const [opening] = messages;

  if (opening === undefined) return undefined;

  return {
    body: messages.join("\n"),
    cwd: workingDirectoryOf(written),
    title: generatedTitleOf(written) || openingOf(opening),
  };
}

function generatedTitleOf(written: Written[]): string {
  const titles = written.flatMap((one) => {
    const title = one.line["aiTitle"];

    return typeof title === "string" && title !== "" ? [title] : [];
  });

  return titles.at(-1) ?? "";
}

function openingOf(message: string): string {
  return message.slice(0, TITLE_FROM_FIRST_MESSAGE).replaceAll(/\s+/gu, " ");
}

function workingDirectoryOf(written: Written[]): string {
  const directories = written.flatMap((one) => {
    const cwd = one.line["cwd"];

    return one.messages.length > 0 && typeof cwd === "string" && cwd !== "" ? [cwd] : [];
  });

  return directories.at(0) ?? "";
}
