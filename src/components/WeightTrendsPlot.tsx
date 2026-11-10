import { Line, LineChart } from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { ChartPlot, type PlotProps } from "./ChartPlot";

/** Faint enough to read as "not measured", but still easy to follow. */
const ESTIMATED_OPACITY = 0.35;

/**
 * Lists the lines that draw one series. The weight is drawn twice: its
 * estimated stretches faded underneath, then its logged stretches solid on
 * top.
 *
 * @param key - The series' field in the rows.
 * @returns The field and opacity of each line, in drawing order.
 */
function linesFor(
  key: keyof ChartRow,
): { dataKey: keyof ChartRow; opacity: number }[] {
  if (key === "weight") {
    return [
      { dataKey: "estimatedWeight", opacity: ESTIMATED_OPACITY },
      { dataKey: "realWeight", opacity: 1 },
    ];
  }
  return [{ dataKey: key, opacity: 1 }];
}

/**
 * The Weight trends chart's lines, with the y-axis fitted to the lines shown.
 */
export function WeightTrendsPlot(props: PlotProps<ChartRow>) {
  return (
    <ChartPlot
      {...props}
      chart={LineChart}
      // "auto" fits the axis to the data rather than starting at 0, so small
      // changes stay visible.
      yDomain={["auto", "auto"]}
    >
      {props.series.flatMap((series) =>
        linesFor(series.key).map(({ dataKey, opacity }) => (
          <Line
            key={dataKey}
            dataKey={dataKey}
            name={series.name}
            // Hidden lines leave the y-axis too, so it rescales to fit the
            // lines that are left.
            hide={props.hidden.has(series.key)}
            stroke={series.color}
            strokeOpacity={opacity}
            strokeWidth={2}
            strokeDasharray={series.dashed ? "6 4" : undefined}
            dot={false}
            activeDot={{ r: 4 }}
            // Straight lines between days, matching how missed days are
            // estimated, rather than curves that overshoot the data.
            type="linear"
            isAnimationActive={false}
          />
        )),
      )}
    </ChartPlot>
  );
}
