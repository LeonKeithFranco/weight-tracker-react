import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sampleChartRow as row } from "../test/chartRow";
import { WeightTrendsChart } from "./WeightTrendsChart";

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
