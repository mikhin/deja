import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseSessionFile } from "#src/services/parse-session-file.ts";

const transcript = (lines: unknown[]): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "deja-"));
  const file = path.join(directory, "session.jsonl");

  writeFileSync(file, lines.map((line) => JSON.stringify(line)).join("\n"));

  return file;
};

describe("parseSessionFile", () => {
  it("prefers the generated title and records the working directory", () => {
    const file = transcript([
      { aiTitle: "Watchdog", type: "ai-title" },
      { cwd: "/p/bot", message: { content: "why are the answers empty" }, type: "user" },
    ]);

    expect(parseSessionFile(file)).toEqual({
      body: "why are the answers empty",
      cwd: "/p/bot",
      title: "Watchdog",
    });
  });

  it("falls back to the opening message when no title was generated", () => {
    const file = transcript([
      { aiTitle: "", type: "ai-title" },
      { cwd: "/p", message: { content: "first\n\nquestion" }, type: "user" },
      { cwd: "/p", message: { content: "second" }, type: "user" },
    ]);

    expect(parseSessionFile(file)?.title).toBe("first question");
  });

  it("skips malformed lines instead of failing", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "deja-"));
    const file = path.join(directory, "broken.jsonl");

    writeFileSync(
      file,
      `{"broken"\n["array"]\n${JSON.stringify({
        cwd: "/p",
        message: { content: "a real message" },
        type: "user",
      })}\n`,
    );

    expect(parseSessionFile(file)?.body).toBe("a real message");
  });

  it("leaves the working directory empty when the transcript never names one", () => {
    const file = transcript([{ message: { content: "no working directory" }, type: "user" }]);

    expect(parseSessionFile(file)?.cwd).toBe("");
  });

  it("returns nothing for a transcript the user never wrote in", () => {
    expect(parseSessionFile(transcript([{ type: "assistant" }]))).toBeUndefined();
  });
});
