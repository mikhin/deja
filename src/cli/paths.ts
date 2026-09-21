import { homedir } from "node:os";
import path from "node:path";

export const TRANSCRIPTS = path.join(homedir(), ".claude", "projects");
export const CACHE = path.join(homedir(), ".cache", "deja");
export const INDEX_FILE = path.join(CACHE, "index.db");
export const PICKS_FILE = path.join(CACHE, "picks.jsonl");
