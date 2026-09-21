import { describe, expect, it } from "vitest";

import { isPlainObject } from "#/services/is-plain-object.ts";

describe("isPlainObject", () => {
  it("accepts an object with keys", () => {
    expect(isPlainObject({ type: "user" })).toBe(true);
  });

  it("rejects null, arrays and primitives", () => {
    expect([isPlainObject(null), isPlainObject([1]), isPlainObject("user")]).toEqual([
      false,
      false,
      false,
    ]);
  });
});
