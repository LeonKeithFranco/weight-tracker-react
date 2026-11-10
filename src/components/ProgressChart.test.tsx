import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleChartRow as row } from "../test/chartRow";
import { ProgressChart } from "./ProgressChart";

/**
 * Reads the legend's items, which are the only buttons a chart card has.
 *
 * @returns Each legend button's text, in order.
 */
function legendNames() {
  return screen.getAllByRole("button").map((button) => button.textContent);
}

describe("ProgressChart", () => {
  it("stacks what's left to lose on top of the loss when a target is set", () => {
    render(
      <ProgressChart
        rows={[row]}
        unit="lb"
        dateFormat="YYYY-MM-DD"
        hasTarget
      />,
    );

    // Listed bottom of the stack first, matching the drawing order.
    expect(legendNames()).toEqual(["Lost since start", "Left to lose"]);
  });

  it("shows only weight lost without a target", () => {
    render(
      <ProgressChart
        rows={[
          { ...row, weightToLose: null, leftToLose: null, pastTarget: null },
        ]}
        unit="lb"
        dateFormat="YYYY-MM-DD"
        hasTarget={false}
      />,
    );

    expect(legendNames()).toEqual(["Lost since start"]);
  });
});
