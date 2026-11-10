import { Line, LineChart, ReferenceLine } from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { ChartPlot, type PlotProps } from "./ChartPlot";

export function LossRatePlot(props: PlotProps<ChartRow>) {
  const [series] = props.series;

  return (
    <ChartPlot
      {...props}
      chart={LineChart}
      // Fits the data, since the rate settles well away from 0 after the
      // first few weeks.
      yDomain={["auto", "auto"]}
    >
      {/* Below 0 means weight gained since the start. Only shows when the axis
          reaches 0. */}
      <ReferenceLine y={0} stroke="var(--chart-axis)" />
      <Line
        dataKey={series.key}
        name={series.name}
        stroke={series.color}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4 }}
        type="linear"
        isAnimationActive={false}
      />
    </ChartPlot>
  );
}
