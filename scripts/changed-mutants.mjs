import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const [baseRef = "origin/main"] = process.argv.slice(2);

const { mutate } = JSON.parse(readFileSync(path.resolve(ROOT, "stryker.config.json"), "utf8"));
const included = mutate.filter((glob) => !glob.startsWith("!"));
const excluded = mutate.filter((glob) => glob.startsWith("!")).map((glob) => glob.slice(1));

const matches = (file) =>
  included.some((glob) => path.matchesGlob(file, glob)) &&
  !excluded.some((glob) => path.matchesGlob(file, glob));

const changed = execFileSync(
  "git",
  ["diff", "--name-only", "--diff-filter=d", `${baseRef}...HEAD`],
  {
    cwd: ROOT,
    encoding: "utf8",
  },
)
  .split("\n")
  .filter(Boolean)
  .map((file) => file.replace(/\.(spec|test)\.(tsx?)$/, ".$2"))
  .filter((file, index, all) => all.indexOf(file) === index)
  .filter(
    (file) =>
      matches(file) && statSync(path.resolve(ROOT, file), { throwIfNoEntry: false })?.isFile(),
  );

process.stdout.write(changed.join(","));
