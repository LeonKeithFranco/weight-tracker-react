import { describe, expect, it } from "vitest";
import { isAllowedWeight, isFutureDate } from "./validation";

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
