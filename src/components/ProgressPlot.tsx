import { Area, AreaChart, ReferenceLine } from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { ChartPlot, type PlotProps } from "./ChartPlot";

/**
 * The fields that draw one series. What's left to lose is drawn in two parts,
 * above and below 0, so neither band jumps across the stack when you pass the
 * target. The legend and tooltip still use the series' own field.
 */
function areasFor(key: keyof ChartRow): (keyof ChartRow)[] {
  return key === "weightToLose" ? ["leftToLose", "pastTarget"] : [key];
}

export function ProgressPlot(props: PlotProps<ChartRow>) {
  return (
    // No `yDomain`: the default starts from 0 and stretches below it when a
    // value goes negative, such as once you're below the target.
    <ChartPlot {...props} chart={AreaChart}>
      {/* Marks 0, where "left to lose" means the target is reached. */}
      <ReferenceLine y={0} stroke="var(--chart-axis)" />
      {props.series.flatMap((item) =>
        areasFor(item.key).map((dataKey) => (
          <Area
            key={dataKey}
            dataKey={dataKey}
            name={item.name}
            hide={props.hidden.has(item.key)}
            stroke={item.color}
            strokeWidth={2}
            fill={item.color}
            // Stacked areas don't overlap, so a fairly strong fill keeps the
            // two bands easy to tell apart.
            fillOpacity={0.5}
            // Areas with the same id are piled on top of each other. The
            // part past the target is a stack of its own, so it starts at 0
            // and hangs below the line instead of sitting on the others.
            stackId={dataKey === "pastTarget" ? "pastTarget" : "progress"}
            activeDot={{ r: 4 }}
            type="linear"
            isAnimationActive={false}
          />
        )),
      )}
    </ChartPlot>
  );
}
