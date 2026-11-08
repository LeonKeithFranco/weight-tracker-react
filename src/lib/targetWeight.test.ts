import { describe, expect, it } from "vitest";
import { formatTargetWeight, parseTargetWeight } from "./targetWeight";
import { KG_PER_LB } from "./units";

describe("formatTargetWeight", () => {
  it("shows the target rounded in the display unit", () => {
    expect(formatTargetWeight(82, "lb")).toBe("180.8");
    expect(formatTargetWeight(82, "kg")).toBe("82.0");
  });

  it("is empty when there's no target", () => {
    expect(formatTargetWeight(null, "lb")).toBe("");
  });
});

describe("parseTargetWeight", () => {
  it("reads a new target in the display unit", () => {
    expect(parseTargetWeight("180", "lb", null)).toEqual({
      ok: true,
      targetWeightKg: 180 * KG_PER_LB,
    });
    expect(parseTargetWeight(" 82.5 ", "kg", 90)).toEqual({
      ok: true,
      targetWeightKg: 82.5,
    });
  });

  it("treats an empty field as no target", () => {
    expect(parseTargetWeight("", "lb", 82)).toEqual({
      ok: true,
      targetWeightKg: null,
    });
    expect(parseTargetWeight("  ", "lb", null)).toEqual({
      ok: true,
      targetWeightKg: null,
    });
  });

  it("keeps the saved target at full precision when the shown text is unchanged", () => {
    expect(parseTargetWeight("180.8", "lb", 82)).toEqual({
      ok: true,
      targetWeightKg: 82,
    });
  });

  it("rejects text that isn't a number above 0", () => {
    for (const text of ["abc", "0", "-5", "1e3"]) {
      expect(parseTargetWeight(text, "lb", null)).toEqual({ ok: false });
    }
  });
});
