import { readFileSync } from "node:fs";

import { parsePickLine } from "#src/services/parse-pick-line.ts";
import type { Pick } from "#src/types/pick.ts";

export function readPicks(file: string): Pick[] {
  let contents: string;

  try {
    contents = readFileSync(file, "utf8");
  } catch {
    return [];
  }

  return contents
    .split("\n")
    .filter(Boolean)
    .map((line) => parsePickLine(line))
    .filter((pick) => pick !== undefined);
}
