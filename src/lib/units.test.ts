import { describe, expect, it } from "vitest";
import {
  formatAverage,
  formatPercent,
  formatWeight,
  fromKg,
  toKg,
} from "./units";

describe("toKg and fromKg", () => {
  it("leaves kg values unchanged", () => {
    expect(toKg(80, "kg")).toBe(80);
    expect(fromKg(80, "kg")).toBe(80);
  });

  it("converts using the exact pound definition", () => {
    expect(toKg(1, "lb")).toBe(0.45359237);
    expect(fromKg(0.45359237, "lb")).toBe(1);
  });
});

describe("formatWeight", () => {
  it("shows one decimal place", () => {
    expect(formatWeight(80.26, "kg")).toBe("80.3");
  });

  it("displays a value entered in lb exactly as it was entered", () => {
    expect(formatWeight(toKg(203.8, "lb"), "lb")).toBe("203.8");
  });

  it("does not show negative zero", () => {
    expect(formatWeight(-0.04, "kg")).toBe("0.0");
  });

  it("keeps real negative values", () => {
    expect(formatWeight(-1.26, "kg")).toBe("-1.3");
  });
});

describe("formatAverage", () => {
  it("shows two decimal places in the chosen unit", () => {
    expect(formatAverage(80.256, "kg")).toBe("80.26");
    expect(formatAverage(0.45359237, "lb")).toBe("1.00");
  });
});

describe("formatPercent", () => {
  it("converts a fraction to a percentage with two decimal places", () => {
    expect(formatPercent(0.0123)).toBe("1.23%");
    expect(formatPercent(-0.005)).toBe("-0.50%");
  });

  it("does not show negative zero", () => {
    expect(formatPercent(-0.000001)).toBe("0.00%");
  });
});
