import { useId } from "react";
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { formatChartLabel } from "../lib/dates";
import type { WeightUnit } from "../lib/types";
import styles from "./chart.module.css";

/**
 * Each figure and its running low share a colour, and the low is dashed, so
 * six lines need only three colours.
 */
const SERIES = [
  { key: "weight", name: "Weight", color: "var(--series-1)", dashed: false },
  {
    key: "lowestWeight",
    name: "Lowest weight",
    color: "var(--series-1)",
    dashed: true,
  },
  {
    key: "average7",
    name: "7-day average",
    color: "var(--series-2)",
    dashed: false,
  },
  {
    key: "lowestAverage7",
    name: "Lowest 7-day average",
    color: "var(--series-2)",
    dashed: true,
  },
  {
    key: "average28",
    name: "28-day average",
    color: "var(--series-3)",
    dashed: false,
  },
  {
    key: "lowestAverage28",
    name: "Lowest 28-day average",
    color: "var(--series-3)",
    dashed: true,
  },
] satisfies {
  key: keyof ChartRow;
  name: string;
  color: string;
  dashed: boolean;
}[];

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
};

export function WeightTrendsChart({ rows, unit }: Props) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Weight trends ({unit})</h2>
      <LineChart className={styles.chart} data={rows} responsive>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatChartLabel}
          stroke="var(--chart-axis)"
          minTickGap={24}
        />
        {/* "auto" fits the axis to the data rather than starting at 0, so
            small changes stay visible. */}
        <YAxis
          domain={["auto", "auto"]}
          stroke="var(--chart-axis)"
          width="auto"
        />
        {/* `null` keeps the lines' own order. The default sorts by name. */}
        <Legend itemSorter={null} />
        {SERIES.map((series) => (
          <Line
            key={series.key}
            dataKey={series.key}
            name={series.name}
            stroke={series.color}
            strokeWidth={2}
            strokeDasharray={series.dashed ? "6 4" : undefined}
            dot={false}
            // Straight lines between days, matching how missed days are
            // estimated, rather than curves that overshoot the data.
            type="linear"
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </section>
  );
}
