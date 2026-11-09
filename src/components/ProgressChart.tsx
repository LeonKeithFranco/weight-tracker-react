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
import type { WeightUnit } from "../lib/types";
import { WEIGHT_DECIMALS } from "../lib/units";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip, type ChartRowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";
import { useHiddenSeries } from "./useHiddenSeries";

const TO_LOSE: ChartRowSeries = {
  key: "weightToLose",
  name: "To lose",
  color: "var(--series-1)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

const LOST: ChartRowSeries = {
  key: "weightLossSinceStart",
  name: "Lost since start",
  color: "var(--series-2)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
  dateFormat: string;
  hasTarget: boolean;
};

/**
 * How far there is to go and how far you've come. The two areas meet in the
 * middle as the loss grows and the amount left shrinks.
 */
export function ProgressChart({ rows, unit, dateFormat, hasTarget }: Props) {
  const headingId = useId();
  const { hidden, toggle } = useHiddenSeries();
  // Without a target there's nothing to lose towards, so only the loss shows.
  const series = hasTarget ? [TO_LOSE, LOST] : [LOST];

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
        {/* Marks 0, where "to lose" means the target is reached. */}
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
        {series.map((item) => (
          <Area
            key={item.key}
            dataKey={item.key}
            name={item.name}
            hide={hidden.has(item.key)}
            stroke={item.color}
            strokeWidth={2}
            fill={item.color}
            // A light fill, so the grid and the other area show through.
            fillOpacity={0.2}
            // Fills towards 0 rather than the bottom of the chart, so a
            // negative value fills downwards from the 0 line.
            baseValue={0}
            activeDot={{ r: 4 }}
            type="linear"
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
      <ChartLegend series={series} hidden={hidden} onToggle={toggle} />
    </section>
  );
}
