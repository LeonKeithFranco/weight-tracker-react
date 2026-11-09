import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleChartRow as row } from "../test/chartRow";
import { LossRateChart } from "./LossRateChart";

describe("LossRateChart", () => {
  it("names its one line in the heading and has no legend", () => {
    render(<LossRateChart rows={[row]} unit="kg" dateFormat="YYYY-MM-DD" />);

    expect(
      screen.getByRole("region", { name: "Loss rate (kg per week)" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
