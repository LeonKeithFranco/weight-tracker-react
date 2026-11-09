import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ChartRow } from "../lib/chartRows";
import { WeightTrendsChart } from "./WeightTrendsChart";

const row: ChartRow = {
  date: "2026-11-05",
  isEstimated: false,
  weight: 200,
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

describe("WeightTrendsChart", () => {
  it("hides a line from its legend and shows it again", async () => {
    const user = userEvent.setup();
    render(
      <WeightTrendsChart rows={[row]} unit="lb" dateFormat="YYYY-MM-DD" />,
    );
    const weight = screen.getByRole("button", { name: "Weight" });

    await user.click(weight);
    expect(weight).toHaveAttribute("aria-pressed", "false");
    // Only the clicked series changes.
    expect(
      screen.getByRole("button", { name: "Lowest weight" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(weight);
    expect(weight).toHaveAttribute("aria-pressed", "true");
  });
});
