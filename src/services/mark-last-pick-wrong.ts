import { writeFileSync } from "node:fs";

import { readPicks } from "#/services/read-picks.ts";
import type { Pick } from "#/types/pick.ts";

export function markLastPickWrong(file: string): Pick | undefined {
  const picks = readPicks(file);
  const last = picks.at(-1);

  if (!last) return undefined;

  const corrected: Pick = { ...last, outcome: "wrong" };
  const kept = [...picks.slice(0, -1), corrected];

  writeFileSync(file, `${kept.map((pick) => JSON.stringify(pick)).join("\n")}\n`);

  return corrected;
}
