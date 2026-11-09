import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RangePresets } from "./RangePresets";

describe("RangePresets", () => {
  it("shows every preset as one group with the current one checked", () => {
    render(<RangePresets value="YTD" onChange={() => {}} />);

    const group = screen.getByRole("group", { name: "Chart range" });
    expect(within(group).getAllByRole("radio")).toHaveLength(6);
    expect(screen.getByRole("radio", { name: "YTD" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).not.toBeChecked();
  });

  it("reports the chosen preset", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RangePresets value="YTD" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "3M" }));

    expect(onChange).toHaveBeenCalledWith("3M");
  });

  it("moves between presets with the arrow keys", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RangePresets value="YTD" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "YTD" }));
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenLastCalledWith("1Y");
  });
});
