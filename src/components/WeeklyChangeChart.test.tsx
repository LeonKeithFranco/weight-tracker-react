import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleChartRow as row } from "../test/chartRow";
import { WeeklyChangeChart } from "./WeeklyChangeChart";

describe("WeeklyChangeChart", () => {
  it("names its one series in the heading and explains the colours", () => {
    render(<WeeklyChangeChart rows={[row]} dateFormat="YYYY-MM-DD" />);

    const chart = screen.getByRole("region", { name: "Weekly change (%)" });
    expect(chart).toHaveTextContent(/Blue bars below 0/);
    // The legend lists the two bar colours, as plain text.
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Loss", "Gain"]);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
