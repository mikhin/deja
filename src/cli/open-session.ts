import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import process from "node:process";

import { formatHomeRelativePath } from "#src/formatters/format-home-relative-path.ts";
import type { SessionHit } from "#src/types/session.ts";

const MISSING_DIRECTORY = 1;

export function openSession(hit: SessionHit): never {
  console.error(`→ ${hit.title}  (${formatHomeRelativePath(hit.cwd, homedir())})`);

  try {
    process.chdir(hit.cwd);
  } catch {
    console.error(`its directory is gone, resume it yourself: claude --resume ${hit.sessionId}`);

    process.exit(MISSING_DIRECTORY);
  }

  const claude = spawnSync("claude", ["--resume", hit.sessionId], { stdio: "inherit" });

  process.exit(claude.status ?? 0);
}
