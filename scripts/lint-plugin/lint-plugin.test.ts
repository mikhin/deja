import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Diagnostic = { code: string; filename: string; message: string };

const fixtures = path.resolve(import.meta.dirname, "fixtures");
const oxlint = path.resolve(import.meta.dirname, "../../node_modules/.bin/oxlint");

const lint = (): Diagnostic[] => {
  const { stdout } = spawnSync(oxlint, ["-c", ".oxlintrc.json", "--format", "json", "."], {
    cwd: fixtures,
    encoding: "utf8",
  });
  const { diagnostics } = JSON.parse(stdout) as { diagnostics: Diagnostic[] };

  return diagnostics.map(({ code, filename, message }) => ({
    code,
    filename: path.basename(filename),
    message,
  }));
};

const diagnostics = lint();

const forRule = (rule: string): Diagnostic[] =>
  diagnostics.filter((diagnostic) => diagnostic.code === `local(${rule})`);

describe("local/no-comments", () => {
  it("reports prose comments and keeps directives", () => {
    const hits = forRule("no-comments");

    expect(hits.map((hit) => hit.filename)).toStrictEqual(["comments.ts", "comments.ts"]);
  });
});

describe("local/one-function-export", () => {
  it("reports the second exported function only", () => {
    const hits = forRule("one-function-export");

    expect(hits.map((hit) => hit.filename)).toStrictEqual(["two-exports.ts"]);
    expect(hits[0]?.message).toContain('"perimeter"');
  });
});

describe("local/no-classes", () => {
  it("reports a class declaration", () => {
    const hits = forRule("no-classes");

    expect(hits.map((hit) => hit.filename)).toStrictEqual(["classy.ts"]);
  });
});

describe("local/no-branching-exports", () => {
  it("reports an exported function that branches, not a helper that does", () => {
    const hits = forRule("no-branching-exports");

    expect(hits.map((hit) => hit.filename)).toStrictEqual(["branching.ts"]);
    expect(hits[0]?.message).toContain('"pick"');
  });
});
