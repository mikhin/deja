import { readdirSync } from "node:fs";
import path from "node:path";

const TRANSCRIPT = ".jsonl";

export function listTranscriptFiles(root: string): { file: string; sessionId: string }[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(path.join(root, entry.name))
        .filter((name) => name.endsWith(TRANSCRIPT))
        .map((name) => ({
          file: path.join(root, entry.name, name),
          sessionId: name.slice(0, -TRANSCRIPT.length),
        })),
    );
}
