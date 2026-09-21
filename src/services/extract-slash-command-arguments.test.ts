import { describe, expect, it } from "vitest";

import { extractSlashCommandArguments } from "#src/services/extract-slash-command-arguments.ts";

describe("extractSlashCommandArguments", () => {
  it("takes what the user typed after the command name", () => {
    const text =
      "<command-name>/consensus</command-name>\n<command-args> optimistic updates </command-args>";

    expect(extractSlashCommandArguments(text)).toEqual(["optimistic updates"]);
  });

  it("takes every pair in the message", () => {
    const text = "<command-args>first</command-args> and <command-args>second</command-args>";

    expect(extractSlashCommandArguments(text)).toEqual(["first", "second"]);
  });

  it("ignores an opening tag that was never closed", () => {
    expect(extractSlashCommandArguments("<command-args>cut off")).toEqual([]);
  });

  it("returns nothing for a message without the tag", () => {
    expect(extractSlashCommandArguments("a plain question")).toEqual([]);
  });
});
