import { appendFileSync } from "node:fs";

import type { Pick } from "#/types/pick.ts";

export function appendPick(file: string, pick: Pick): boolean {
  try {
    appendFileSync(file, `${JSON.stringify(pick)}\n`);

    return true;
  } catch {
    return false;
  }
}
