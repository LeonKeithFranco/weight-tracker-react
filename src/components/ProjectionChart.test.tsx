import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SimulatedDay } from "../lib/simulation";
import type { DailyPoint } from "../lib/types";
import { ProjectionChart } from "./ProjectionChart";

const series: DailyPoint[] = [
  { date: "2026-01-01", weightKg: 90, isEstimated: false },
  { date: "2026-01-02", weightKg: 89.5, isEstimated: false },
];

const simulated: SimulatedDay[] = [
  { date: "2026-01-03", lowKg: 88, medianKg: 89, highKg: 90 },
];

function legendNames() {
  return screen.getAllByRole("button").map((button) => button.textContent);
}

describe("ProjectionChart", () => {
  it("shows the weight, the projection and the target in its legend", () => {
    render(
      <ProjectionChart
        series={series}
        simulated={simulated}
        unit="kg"
        dateFormat="YYYY-MM-DD"
        targetWeightKg={80}
      />,
    );

    expect(legendNames()).toEqual([
      "Weight",
      "Projected median",
      "Likely range",
      "Target",
    ]);
  });

  it("leaves the target out when none is set", () => {
    render(
      <ProjectionChart
        series={series}
        simulated={simulated}
        unit="kg"
        dateFormat="YYYY-MM-DD"
        targetWeightKg={null}
      />,
    );

    expect(legendNames()).not.toContain("Target");
  });

  it("explains when there isn't enough data to simulate", () => {
    render(
      <ProjectionChart
        series={series}
        simulated={null}
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
