import { Area, ComposedChart, Line } from "recharts";
import type { ProjectionRow } from "../lib/projectionRows";
import { ChartPlot, type PlotProps } from "./ChartPlot";

export function ProjectionPlot(props: PlotProps<ProjectionRow>) {
  const range = props.series.find((item) => item.key === "range");

  return (
    <ChartPlot {...props} chart={ComposedChart} yDomain={["auto", "auto"]}>
      {/* Drawn first, so the lines sit on top of the band. A `[low, high]`
          value makes Recharts fill between the two. */}
      {range && (
        <Area
          dataKey="range"
          name={range.name}
          hide={props.hidden.has("range")}
          stroke="none"
          fill={range.color}
          fillOpacity={0.25}
          activeDot={false}
          type="linear"
          isAnimationActive={false}
        />
      )}
      {props.series
        .filter((item) => item.key !== "range")
        .map((item) => (
          <Line
            key={item.key}
            dataKey={item.key}
            name={item.name}
            hide={props.hidden.has(item.key)}
            stroke={item.color}
            strokeWidth={2}
            strokeDasharray={item.dashed ? "6 4" : undefined}
            dot={false}
            activeDot={{ r: 4 }}
            type="linear"
            isAnimationActive={false}
          />
        ))}
    </ChartPlot>
  );
}
