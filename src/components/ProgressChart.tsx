import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { formatChartLabel } from "../lib/dates";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { WEIGHT_DECIMALS } from "../lib/units";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip, type ChartRowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";
import { useHiddenSeries } from "./useHiddenSeries";

const TO_LOSE: ChartRowSeries = {
  key: "weightToLose",
  name: FIGURE_LABELS.weightToLoseKg,
  color: "var(--series-1)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

const LOST: ChartRowSeries = {
  key: "weightLossSinceStart",
  name: FIGURE_LABELS.weightLossSinceStartKg,
  color: "var(--series-2)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

/**
 * The fields that draw one series. What's left to lose is drawn in two parts,
 * above and below 0, so neither band jumps across the stack when you pass the
 * target. The legend and tooltip still use the series' own field.
 */
function areasFor(key: keyof ChartRow): (keyof ChartRow)[] {
  return key === "weightToLose" ? ["leftToLose", "pastTarget"] : [key];
}

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
  dateFormat: string;
  hasTarget: boolean;
};

/**
 * How far you've come, with how far there is to go stacked on top. The two
 * add up to the start weight minus the target, so the stack stays the same
 * height and the split between the colours shows the progress.
 */
export function ProgressChart({ rows, unit, dateFormat, hasTarget }: Props) {
  const headingId = useId();
  const { hidden, toggle } = useHiddenSeries();
  // Without a target there's nothing to lose towards, so only the loss shows.
  // The first series is drawn at the bottom of the stack.
  const series = hasTarget ? [LOST, TO_LOSE] : [LOST];

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Progress ({unit})</h2>
      <AreaChart className={styles.chart} data={rows} responsive>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatChartLabel}
          stroke="var(--chart-axis)"
          minTickGap={24}
        />
        {/* Starts from 0 by default, and stretches below it when a value goes
            negative, such as once you're below the target. */}
        <YAxis stroke="var(--chart-axis)" width="auto" />
        {/* Marks 0, where "left to lose" means the target is reached. */}
        <ReferenceLine y={0} stroke="var(--chart-axis)" />
        <Tooltip
          content={({ active, payload }) => {
            const row = payload[0]?.payload as ChartRow | undefined;
            return active && row ? (
              <ChartTooltip
                row={row}
                series={series}
                hidden={hidden}
                suffix={` ${unit}`}
                dateFormat={dateFormat}
              />
            ) : null;
          }}
          cursor={{ stroke: "var(--chart-axis)" }}
          isAnimationActive={false}
        />
        {series.flatMap((item) =>
          areasFor(item.key).map((dataKey) => (
            <Area
              key={dataKey}
              dataKey={dataKey}
              name={item.name}
              hide={hidden.has(item.key)}
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
      </AreaChart>
      <ChartLegend series={series} hidden={hidden} onToggle={toggle} />
    </section>
  );
}
