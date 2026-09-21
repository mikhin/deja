import { spawnSync } from "node:child_process";

import { formatSessionRow } from "#/formatters/format-session-row.ts";
import type { SessionHit } from "#/types/session.ts";

export const FZF_MISSING = "fzf-missing";

export function chooseSession(hits: SessionHit[]): SessionHit | typeof FZF_MISSING | undefined {
  const fzf = spawnSync("fzf", ["--delimiter=\t", "--with-nth=2..", "--height=40%", "--reverse"], {
    encoding: "utf8",
    input: hits.map((hit) => formatSessionRow(hit)).join("\n"),
    stdio: ["pipe", "pipe", "inherit"],
  });

  if (fzf.error) return FZF_MISSING;

  const chosen = fzf.stdout.trim().split("\t")[0];

  return hits.find((hit) => hit.sessionId === chosen);
}
