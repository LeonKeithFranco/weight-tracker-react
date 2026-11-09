import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChartLegend, type LegendItem } from "./ChartLegend";

const items: LegendItem[] = [
  { key: "weight", name: "Weight", color: "red", dashed: false },
  { key: "lowestWeight", name: "Lowest weight", color: "red", dashed: true },
];

describe("ChartLegend", () => {
  it("shows each item as a button, pressed while it's shown", () => {
    render(
      <ChartLegend
        items={items}
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

  it("reports which item was clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <ChartLegend items={items} hidden={new Set()} onToggle={onToggle} />,
    );

    await user.click(screen.getByRole("button", { name: "Lowest weight" }));

    expect(onToggle).toHaveBeenCalledWith("lowestWeight");
  });

  it("lists plain items, with no buttons, when nothing can be toggled", () => {
    render(<ChartLegend items={items} hidden={new Set()} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems.map((item) => item.textContent)).toEqual([
      "Weight",
      "Lowest weight",
    ]);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
