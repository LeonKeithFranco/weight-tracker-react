import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartRow } from "../lib/chartRows";
import { sampleChartRow } from "../test/chartRow";
import { ChartTooltip, type ChartRowSeries } from "./ChartTooltip";

// Values that need rounding, and no target.
const row: ChartRow = {
  ...sampleChartRow,
  weight: 203.84,
  average7: 204.126,
  weightToLose: null,
};

const series: ChartRowSeries[] = [
  { key: "weight", name: "Weight", color: "red", dashed: false, decimals: 1 },
  {
    key: "average7",
    name: "7-day average",
    color: "blue",
    dashed: false,
    decimals: 2,
  },
  {
    key: "weightToLose",
    name: "To lose",
    color: "green",
    dashed: false,
    decimals: 1,
  },
];

function renderTooltip(props: Partial<Parameters<typeof ChartTooltip>[0]>) {
  render(
    <ChartTooltip
      row={row}
      series={series}
      hidden={new Set()}
      suffix=" lb"
      dateFormat="DD/MM/YYYY"
      {...props}
    />,
  );
}

describe("ChartTooltip", () => {
  it("shows the date in the chosen format and each value rounded", () => {
    renderTooltip({});

    expect(screen.getByText("05/11/2026")).toBeInTheDocument();
    expect(screen.getByText("203.8 lb")).toBeInTheDocument();
    expect(screen.getByText("204.13 lb")).toBeInTheDocument();
    expect(screen.queryByText("Estimated")).not.toBeInTheDocument();
  });

  it("marks an estimated day", () => {
    renderTooltip({ row: { ...row, isEstimated: true } });

    expect(screen.getByText("Estimated")).toBeInTheDocument();
  });

  it("leaves out hidden series and empty values", () => {
    renderTooltip({ hidden: new Set(["weight"]) });

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      ["7-day average"],
    );
  });
});
