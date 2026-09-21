import { describe, expect, it } from "vitest";

import { formatHomeRelativePath } from "#src/formatters/format-home-relative-path.ts";

describe("formatHomeRelativePath", () => {
  it("replaces the home prefix with a tilde", () => {
    expect(formatHomeRelativePath("/Users/me/Code/shop", "/Users/me")).toBe("~/Code/shop");
  });

  it("shortens the home directory itself", () => {
    expect(formatHomeRelativePath("/Users/me", "/Users/me")).toBe("~");
  });

  it("leaves a path outside home untouched", () => {
    expect(formatHomeRelativePath("/opt/tools", "/Users/me")).toBe("/opt/tools");
  });

  it("does not shorten a sibling directory whose name starts the same", () => {
    expect(formatHomeRelativePath("/Users/meredith/Code", "/Users/me")).toBe(
      "/Users/meredith/Code",
    );
  });

  it("leaves everything untouched when home is unknown", () => {
    expect(formatHomeRelativePath("/Users/me/Code", "")).toBe("/Users/me/Code");
  });
});
