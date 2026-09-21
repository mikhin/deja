import { isPlainObject } from "#src/services/is-plain-object.ts";
import { parseJsonLine } from "#src/services/parse-json-line.ts";
import type { Pick, PickOutcome } from "#src/types/pick.ts";

const OUTCOMES: PickOutcome[] = ["abandoned", "auto", "miss", "picked", "wrong"];

export function parsePickLine(line: string): Pick | undefined {
  const parsed = parseJsonLine(line);

  if (!isPlainObject(parsed)) return undefined;

  const outcome = OUTCOMES.find((known) => known === parsed["outcome"]);

  if (!outcome || typeof parsed["query"] !== "string") return undefined;

  return {
    at: text(parsed["at"]),
    outcome,
    query: parsed["query"],
    ...counter("listPosition", parsed["listPosition"]),
    ...counter("termsKept", parsed["termsKept"]),
    ...counter("termsTyped", parsed["termsTyped"]),
  };
}

function counter(name: string, value: unknown): Record<string, number> {
  return typeof value === "number" ? { [name]: value } : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
