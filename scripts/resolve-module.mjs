import { globSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");

export const SRC = path.resolve(ROOT, "src");

const knipConfig = JSON.parse(readFileSync(path.resolve(ROOT, "knip.json"), "utf8"));

const tsconfig = JSON.parse(readFileSync(path.resolve(ROOT, "tsconfig.base.json"), "utf8"));

const SRC_ALIAS =
  Object.keys(tsconfig.compilerOptions?.paths ?? {}).find((pattern) => pattern.endsWith("/*")) ??
  "@/*";

const ALIAS_PREFIX = SRC_ALIAS.slice(0, -1);

const ignoredByKnip = (file) =>
  (knipConfig.ignore ?? []).some((pattern) => path.matchesGlob(file, pattern));

export const knipEntries = () =>
  (knipConfig.entry ?? [])
    .filter((entry) => entry.startsWith("src/"))
    .map((entry) => path.resolve(ROOT, entry));

export const sourceFiles = () =>
  globSync("src/**/*.{ts,tsx}", { cwd: ROOT })
    .map(String)
    .filter((file) => !/\.(spec|test)\.tsx?$/.test(file) && !file.endsWith(".d.ts"))
    .filter((file) => !ignoredByKnip(file))
    .toSorted();

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

const basePath = (specifier, fromFile) => {
  if (specifier.startsWith(ALIAS_PREFIX)) {
    return path.resolve(SRC, specifier.slice(ALIAS_PREFIX.length));
  }

  if (specifier.startsWith(".")) return path.resolve(path.dirname(fromFile), specifier);

  return null;
};

export const resolveModule = (specifier, fromFile) => {
  const base = basePath(specifier, fromFile);

  if (base === null) return null;

  const found = CANDIDATE_SUFFIXES.map((suffix) => base + suffix).find((candidate) =>
    statSync(candidate, { throwIfNoEntry: false })?.isFile(),
  );

  return found ?? false;
};
