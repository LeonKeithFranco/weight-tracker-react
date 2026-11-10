import { Bar, BarChart, Cell, ReferenceLine } from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { ChartPlot, type PlotProps } from "./ChartPlot";

export function WeeklyChangePlot(props: PlotProps<ChartRow>) {
  const [series] = props.series;

  return (
    <ChartPlot
      {...props}
      chart={BarChart}
      yTickFormatter={(value) => `${value}%`}
    >
      <ReferenceLine y={0} stroke="var(--chart-axis)" />
      <Bar dataKey={series.key} name={series.name} isAnimationActive={false}>
        {/* One cell per row, in the same order, so each bar gets the colour
            for its own direction. */}
        {props.rows.map((row) => (
          <Cell
            key={row.date}
            fill={
              row.average7ChangePercent > 0
                ? "var(--chart-gain)"
                : "var(--chart-loss)"
            }
          />
        ))}
      </Bar>
    </ChartPlot>
  );
}
