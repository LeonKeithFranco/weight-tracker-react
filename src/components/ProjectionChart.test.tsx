import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProjectedDay } from "../lib/projectedRange";
import type { DailyPoint } from "../lib/types";
import { ProjectionChart } from "./ProjectionChart";

/** Two logged days to project from. */
const series: DailyPoint[] = [
  { date: "2026-01-01", weightKg: 90, isEstimated: false },
  { date: "2026-01-02", weightKg: 89.5, isEstimated: false },
];

/** One projected day after {@link series}. */
const projected: ProjectedDay[] = [
  { date: "2026-01-03", lowKg: 88, trendKg: 89, highKg: 90 },
];

/**
 * Reads the legend's items, which are the only buttons a chart card has.
 *
 * @returns Each legend button's text, in order.
 */
function legendNames() {
  return screen.getAllByRole("button").map((button) => button.textContent);
}

describe("ProjectionChart", () => {
  it("shows the weight, the projection and the target in its legend", () => {
    render(
      <ProjectionChart
        series={series}
        projected={projected}
        unit="kg"
        dateFormat="YYYY-MM-DD"
        targetWeightKg={80}
      />,
    );

    expect(legendNames()).toEqual([
      "Weight",
      "Projected trend",
      "Likely range",
      "Target",
    ]);
  });

  it("leaves the target out when none is set", () => {
    render(
      <ProjectionChart
        series={series}
        projected={projected}
        unit="kg"
        dateFormat="YYYY-MM-DD"
        targetWeightKg={null}
      />,
    );

    expect(legendNames()).not.toContain("Target");
  });

  it("explains when there isn't enough data to project from", () => {
    render(
      <ProjectionChart
        series={series}
        projected={null}
        unit="kg"
        dateFormat="YYYY-MM-DD"
        targetWeightKg={80}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Projection (kg)" }),
    ).toHaveTextContent("Not enough data");
  });
});
