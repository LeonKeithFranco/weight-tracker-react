import { describe, expect, it } from "vitest";
import { KG_PER_LB } from "./units";
import { isAllowedWeight, isFutureDate, parseWeight } from "./validation";

describe("parseWeight", () => {
  it("reads a plain decimal number in the given unit", () => {
    expect(parseWeight("92.4", "kg")).toBe(92.4);
    expect(parseWeight("90", "kg")).toBe(90);
    expect(parseWeight("203.8", "lb")).toBe(203.8 * KG_PER_LB);
  });

  it("rejects text that isn't a plain decimal number", () => {
    for (const text of ["", "abc", "1e3", "0x10", "-5", "92.", ".5", "92,4"]) {
      expect(parseWeight(text, "kg")).toBeNull();
    }
  });

  it("rejects 0", () => {
    expect(parseWeight("0", "kg")).toBeNull();
    expect(parseWeight("0.0", "lb")).toBeNull();
  });
});

describe("isAllowedWeight", () => {
  it("allows any weight above 0", () => {
    expect(isAllowedWeight(0.1)).toBe(true);
    expect(isAllowedWeight(92.4)).toBe(true);
    expect(isAllowedWeight(2038)).toBe(true);
  });

  it("rejects 0 and negative weights", () => {
    expect(isAllowedWeight(0)).toBe(false);
    expect(isAllowedWeight(-1)).toBe(false);
  });

  it("rejects values that aren't real numbers", () => {
    expect(isAllowedWeight(Number.NaN)).toBe(false);
    expect(isAllowedWeight(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("isFutureDate", () => {
  it("allows today and earlier", () => {
    expect(isFutureDate("2026-11-06", "2026-11-06")).toBe(false);
    expect(isFutureDate("2025-12-31", "2026-11-06")).toBe(false);
  });

  it("rejects dates after today", () => {
    expect(isFutureDate("2026-11-07", "2026-11-06")).toBe(true);
    expect(isFutureDate("2027-01-01", "2026-11-06")).toBe(true);
  });
});
