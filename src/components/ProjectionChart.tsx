import { useId } from "react";
import { Area, ComposedChart, Line } from "recharts";
import { FIGURE_LABELS } from "../lib/figureLabels";
import { toProjectionRows, type ProjectionRow } from "../lib/projectionRows";
import type { SimulatedDay } from "../lib/simulation";
import type { DailyPoint, WeightUnit } from "../lib/types";
import { WEIGHT_DECIMALS } from "../lib/units";
import { ChartFrame } from "./ChartFrame";
import type { RowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";
import { useHiddenSeries } from "./useHiddenSeries";

const WEIGHT: RowSeries<ProjectionRow> = {
  key: "weight",
  name: FIGURE_LABELS.weightKg,
  color: "var(--series-1)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

// The median and its band share a colour, so they read as one projection.
const MEDIAN: RowSeries<ProjectionRow> = {
  key: "median",
  name: "Projected median",
  color: "var(--series-2)",
  dashed: true,
  decimals: WEIGHT_DECIMALS,
};

const RANGE: RowSeries<ProjectionRow> = {
  key: "range",
  name: "Likely range",
  color: "var(--series-2)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

const TARGET: RowSeries<ProjectionRow> = {
  key: "target",
  name: "Target",
  color: "var(--series-3)",
  dashed: true,
  decimals: WEIGHT_DECIMALS,
};

type Props = {
  series: DailyPoint[];
  /** `null` when there aren't enough days to simulate. */
  simulated: SimulatedDay[] | null;
  unit: WeightUnit;
  dateFormat: string;
  targetWeightKg: number | null;
};

/**
 * Where the weight might go over the next 180 days, from a random walk of
 * recent day-to-day changes: the median path and the range that 80% of the
 * paths fall within.
 */
export function ProjectionChart({
  series,
  simulated,
  unit,
  dateFormat,
  targetWeightKg,
}: Props) {
  const { hidden, toggle } = useHiddenSeries();
  const headingId = useId();
  const title = `Projection (${unit})`;

  if (simulated === null) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId}>{title}</h2>
        <p>Not enough data. The projection needs at least 14 days.</p>
      </section>
    );
  }

  const rows = toProjectionRows(series, simulated, unit, targetWeightKg);
  // Without a target, the target line is left out, as the spec says.
  const legend =
    targetWeightKg === null
      ? [WEIGHT, MEDIAN, RANGE]
      : [WEIGHT, MEDIAN, RANGE, TARGET];

  return (
    <ChartFrame
      title={title}
      chart={ComposedChart}
      rows={rows}
      series={legend}
      hidden={hidden}
      onToggle={toggle}
      suffix={` ${unit}`}
      dateFormat={dateFormat}
      yDomain={["auto", "auto"]}
      footer={
        <p className={styles.note}>
          The last 90 days, then 180 simulated days. The range shows where 80%
          of 1,000 simulated paths fall. It doesn&apos;t follow the range
          presets, which only cover the past.
        </p>
      }
    >
      {/* Drawn first, so the lines sit on top of the band. A `[low, high]`
          value makes Recharts fill between the two. */}
      <Area
        dataKey="range"
        name={RANGE.name}
        hide={hidden.has("range")}
        stroke="none"
        fill={RANGE.color}
        fillOpacity={0.25}
        activeDot={false}
        type="linear"
        isAnimationActive={false}
      />
      {legend
        .filter((item) => item.key !== "range")
        .map((item) => (
          <Line
            key={item.key}
            dataKey={item.key}
            name={item.name}
            hide={hidden.has(item.key)}
            stroke={item.color}
            strokeWidth={2}
            strokeDasharray={item.dashed ? "6 4" : undefined}
            dot={false}
            activeDot={{ r: 4 }}
            type="linear"
            isAnimationActive={false}
          />
        ))}
    </ChartFrame>
  );
}
