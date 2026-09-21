import { isPlainObject } from "#/services/is-plain-object.ts";

export function collectTextBlocks(content: unknown): string[] {
  if (typeof content === "string") return [content];

  if (!Array.isArray(content)) return [];

  return content.flatMap((block: unknown) => {
    if (!isPlainObject(block) || block["type"] !== "text") return [];

    const text = block["text"];

    return typeof text === "string" ? [text] : [];
  });
}
