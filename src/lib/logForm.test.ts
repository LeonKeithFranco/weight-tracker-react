import { describe, expect, it } from "vitest";
import { parseLogForm } from "./logForm";
import { KG_PER_LB } from "./units";

/** The date the tests treat as today, which the form's date can't be after. */
const TODAY = "2026-11-07";

describe("parseLogForm", () => {
  it("turns valid values into an entry in kg", () => {
    expect(
      parseLogForm({ date: "2026-11-07", weight: "203.8" }, "lb", TODAY),
    ).toEqual({
      ok: true,
      entry: { date: "2026-11-07", weightKg: 203.8 * KG_PER_LB },
    });
    expect(
      parseLogForm({ date: "2026-11-01", weight: "92.4" }, "kg", TODAY),
    ).toEqual({ ok: true, entry: { date: "2026-11-01", weightKg: 92.4 } });
  });

  it("ignores spaces around the weight", () => {
    expect(
      parseLogForm({ date: TODAY, weight: " 92.4 " }, "kg", TODAY),
    ).toEqual({ ok: true, entry: { date: TODAY, weightKg: 92.4 } });
  });

  it("rejects a missing date or weight", () => {
    expect(parseLogForm({ date: "", weight: "" }, "kg", TODAY)).toEqual({
      ok: false,
      errors: { date: "missing", weight: "missing" },
    });
    expect(parseLogForm({ date: TODAY, weight: "   " }, "kg", TODAY)).toEqual({
      ok: false,
      errors: { weight: "missing" },
    });
  });

  it("rejects a future date", () => {
    expect(
      parseLogForm({ date: "2026-11-08", weight: "92.4" }, "kg", TODAY),
    ).toEqual({ ok: false, errors: { date: "future" } });
  });

  it("rejects a weight that isn't a plain number above 0", () => {
    for (const weight of ["abc", "0", "-5", "1e3"]) {
      expect(parseLogForm({ date: TODAY, weight }, "kg", TODAY)).toEqual({
        ok: false,
        errors: { weight: "invalid" },
      });
    }
  });

  it("reports both fields when both are wrong", () => {
    expect(
      parseLogForm({ date: "2026-12-01", weight: "abc" }, "kg", TODAY),
    ).toEqual({ ok: false, errors: { date: "future", weight: "invalid" } });
  });
});
