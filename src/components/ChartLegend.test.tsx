import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChartLegend, type ChartSeries } from "./ChartLegend";

const series: ChartSeries[] = [
  { key: "weight", name: "Weight", color: "red", dashed: false, decimals: 1 },
  {
    key: "lowestWeight",
    name: "Lowest weight",
    color: "red",
    dashed: true,
    decimals: 1,
  },
];

describe("ChartLegend", () => {
  it("shows each series as a button, pressed while it's shown", () => {
    render(
      <ChartLegend
        series={series}
        hidden={new Set(["lowestWeight"])}
        onToggle={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Weight" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Lowest weight" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("reports which series was clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <ChartLegend series={series} hidden={new Set()} onToggle={onToggle} />,
    );

    await user.click(screen.getByRole("button", { name: "Lowest weight" }));

    expect(onToggle).toHaveBeenCalledWith("lowestWeight");
  });
});
