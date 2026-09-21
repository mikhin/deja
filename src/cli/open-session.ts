import { spawnSync } from "node:child_process";
import process from "node:process";

import type { SessionHit } from "#/types/session.ts";

export function openSession(hit: SessionHit): never {
  console.error(`→ ${hit.title}  (${hit.cwd})`);

  process.chdir(hit.cwd);

  const claude = spawnSync("claude", ["--resume", hit.sessionId], { stdio: "inherit" });

  process.exit(claude.status ?? 0);
}
