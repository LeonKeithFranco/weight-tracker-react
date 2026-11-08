import { describe, expect, it } from "vitest";
import { describeError } from "./describeError";

describe("describeError", () => {
  it("keeps an error's name, message and stack", () => {
    const error = new TypeError("bad value");

    expect(describeError(error)).toEqual({
      name: "TypeError",
      message: "bad value",
      stack: error.stack,
    });
  });

  it("turns anything else into text", () => {
    expect(describeError("just a string")).toEqual({ value: "just a string" });
    expect(describeError(42)).toEqual({ value: "42" });
    expect(describeError(undefined)).toEqual({ value: "undefined" });
  });
});
