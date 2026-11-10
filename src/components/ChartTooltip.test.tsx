import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartRow } from "../lib/chartRows";
import { sampleChartRow } from "../test/chartRow";
import { ChartTooltip, type ChartRowSeries } from "./ChartTooltip";

/**
 * A day with values that need rounding, and no target, so its weight to lose
 * is empty.
 */
const row: ChartRow = {
  ...sampleChartRow,
  weight: 203.84,
  average7: 204.126,
  weightToLose: null,
};

/**
 * Three series, rounded to different places, the last of which is empty in
 * {@link row}.
 */
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
    name: "Left to lose",
    color: "green",
    dashed: false,
    decimals: 1,
  },
];

/**
 * Renders the tooltip for {@link row} and {@link series}, in lb with a
 * `DD/MM/YYYY` date, nothing hidden.
 *
 * @remarks
 * `typeof ChartTooltip<ChartRow>` fixes the generic to this row type before
 * reading its props, which would otherwise use the bare minimum row.
 *
 * @param props - Any props to use instead of those defaults.
 */
function renderTooltip(
  props: Partial<Parameters<typeof ChartTooltip<ChartRow>>[0]>,
) {
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
  it("shows a [low, high] range as one value", () => {
    render(
      <ChartTooltip
        row={{ date: "2026-11-05", isEstimated: false, range: [88.04, 90.96] }}
        series={[
          {
            key: "range",
            name: "Likely range",
            color: "red",
            dashed: false,
            decimals: 1,
          },
        ]}
        hidden={new Set()}
        suffix=" kg"
        dateFormat="YYYY-MM-DD"
      />,
    );

    expect(screen.getByText("88.0 – 91.0 kg")).toBeInTheDocument();
  });

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
