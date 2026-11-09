import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartRow } from "../lib/chartRows";
import { ProgressChart } from "./ProgressChart";

const row: ChartRow = {
  date: "2026-11-05",
  isEstimated: false,
  weight: 200,
  realWeight: 200,
  estimatedWeight: null,
  lowestWeight: 199,
  average7: 201,
  lowestAverage7: 200.5,
  average7ChangePercent: -1,
  average28: 202,
  lowestAverage28: 201.5,
  weightToLose: 20,
  weightLossSinceStart: 10,
  weightLossPerWeek: 1,
};

function legendNames() {
  return screen.getAllByRole("button").map((button) => button.textContent);
}

describe("ProgressChart", () => {
  it("shows weight to lose and weight lost when a target is set", () => {
    render(
      <ProgressChart
        rows={[row]}
        unit="lb"
        dateFormat="YYYY-MM-DD"
        hasTarget
      />,
    );

    expect(legendNames()).toEqual(["To lose", "Lost since start"]);
  });

  it("shows only weight lost without a target", () => {
    render(
      <ProgressChart
        rows={[{ ...row, weightToLose: null }]}
        unit="lb"
        dateFormat="YYYY-MM-DD"
        hasTarget={false}
      />,
    );

    expect(legendNames()).toEqual(["Lost since start"]);
  });
});
