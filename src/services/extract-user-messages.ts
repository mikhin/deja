import { collectTextBlocks } from "#/services/collect-text-blocks.ts";
import { extractSlashCommandArguments } from "#/services/extract-slash-command-arguments.ts";
import { isPlainObject } from "#/services/is-plain-object.ts";

const WRITTEN_BY_TOOLING =
  /^(<(command-message|command-name|local-command|system-reminder|user-memory|bash-)|Base directory for this skill:|Caveat: )/;

export function extractUserMessages(line: unknown): string[] {
  if (!isPlainObject(line) || line["type"] !== "user" || line["isSidechain"] === true) return [];

  const message = line["message"];
  const content = isPlainObject(message) ? message["content"] : undefined;

  return collectTextBlocks(content).flatMap((text) => {
    const whole = text.trim();
    const written = whole && !WRITTEN_BY_TOOLING.test(whole) ? [whole] : [];

    return [...extractSlashCommandArguments(text), ...written].filter(Boolean);
  });
}
