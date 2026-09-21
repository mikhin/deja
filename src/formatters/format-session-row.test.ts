import { describe, expect, it } from "vitest";

import { formatSessionRow } from "#/formatters/format-session-row.ts";
import type { SessionHit } from "#/types/session.ts";

const hit = (fields: Partial<SessionHit>): SessionHit => ({
  cwd: "/Users/me/Code/fuel-bot",
  modifiedAt: Date.UTC(2026, 8, 14, 12),
  score: -11,
  sessionId: "0a5a52b3",
  title: "Watchdog reports a high rate of empty results",
  ...fields,
});

describe("formatSessionRow", () => {
  it("puts the id, the day, the project and the title in tab separated columns", () => {
    expect(formatSessionRow(hit({})).split("\t")).toEqual([
      "0a5a52b3",
      "2026-09-14",
      "fuel-bot              ",
      "Watchdog reports a high rate of empty results",
    ]);
  });

  it("cuts a long project name to the column width", () => {
    const row = formatSessionRow(hit({ cwd: "/Users/me/Code/figma-mind-map-importer-plugin" }));

    expect(row.split("\t")[2]).toBe("figma-mind-map-importe");
  });

  it("cuts a long title", () => {
    const row = formatSessionRow(hit({ title: "t".repeat(80) }));

    expect(row.split("\t")[3]).toBe("t".repeat(70));
  });

  it("shows a question mark when there is no working directory", () => {
    expect(formatSessionRow(hit({ cwd: "" })).split("\t")[2]).toBe("?                     ");
  });
});
