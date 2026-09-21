import { describe, expect, it } from "vitest";

import { extractUserMessages } from "#/services/extract-user-messages.ts";

const userLine = (content: unknown): Record<string, unknown> => ({
  cwd: "/p",
  message: { content },
  type: "user",
});

describe("extractUserMessages", () => {
  it("returns a plain string message", () => {
    expect(extractUserMessages(userLine("how do I make a backup"))).toEqual([
      "how do I make a backup",
    ]);
  });

  it("keeps only text blocks of a structured message", () => {
    const content = [
      { text: "the first one", type: "text" },
      { text: 42, type: "text" },
      { id: "t1", type: "tool_use" },
      "not a block",
    ];

    expect(extractUserMessages(userLine(content))).toEqual(["the first one"]);
  });

  it("keeps the arguments a slash command was typed with", () => {
    const text =
      "<command-name>/consensus</command-name>\n<command-args>optimistic updates</command-args>";

    expect(extractUserMessages(userLine(text))).toEqual(["optimistic updates"]);
  });

  it("drops text injected by skills and hooks", () => {
    expect(extractUserMessages(userLine("Base directory for this skill: /skills/x"))).toEqual([]);
  });

  it("ignores subagent messages and non-user lines", () => {
    const subagent = { ...userLine("subagent text"), isSidechain: true };

    expect([
      extractUserMessages(subagent),
      extractUserMessages({ type: "assistant" }),
      extractUserMessages("a bare string"),
      extractUserMessages({ message: "no content", type: "user" }),
    ]).toEqual([[], [], [], []]);
  });
});
