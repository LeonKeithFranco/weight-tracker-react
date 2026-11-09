import { useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { formatChartLabel } from "../lib/dates";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { AVERAGE_DECIMALS, WEIGHT_DECIMALS } from "../lib/units";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip, type ChartRowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";
import { useHiddenSeries } from "./useHiddenSeries";

/**
 * Each figure and its running low share a colour, and the low is dashed, so
 * six lines need only three colours.
 */
const SERIES = [
  {
    key: "weight",
    name: FIGURE_LABELS.weightKg,
    color: "var(--series-1)",
    dashed: false,
    decimals: WEIGHT_DECIMALS,
  },
  {
    key: "lowestWeight",
    name: FIGURE_LABELS.lowestWeightKg,
    color: "var(--series-1)",
    dashed: true,
    decimals: WEIGHT_DECIMALS,
  },
  {
    key: "average7",
    name: FIGURE_LABELS.average7Kg,
    color: "var(--series-2)",
    dashed: false,
    decimals: AVERAGE_DECIMALS,
  },
  {
    key: "lowestAverage7",
    name: FIGURE_LABELS.lowestAverage7Kg,
    color: "var(--series-2)",
    dashed: true,
    decimals: AVERAGE_DECIMALS,
  },
  {
    key: "average28",
    name: FIGURE_LABELS.average28Kg,
    color: "var(--series-3)",
    dashed: false,
    decimals: AVERAGE_DECIMALS,
  },
  {
    key: "lowestAverage28",
    name: FIGURE_LABELS.lowestAverage28Kg,
    color: "var(--series-3)",
    dashed: true,
    decimals: AVERAGE_DECIMALS,
  },
] satisfies ChartRowSeries[];

/** Faint enough to read as "not measured", but still easy to follow. */
const ESTIMATED_OPACITY = 0.35;

/**
 * The lines that draw one series. The weight is drawn twice: its estimated
 * stretches faded underneath, then its logged stretches solid on top.
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

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
  dateFormat: string;
};

export function WeightTrendsChart({ rows, unit, dateFormat }: Props) {
  const headingId = useId();
  const { hidden, toggle } = useHiddenSeries();

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
        <Tooltip
          // Recharts works out which day is under the pointer and passes its
          // data in. Every line shares one row per day, so the first entry's
          // row is the whole day, whichever lines are hidden.
          content={({ active, payload }) => {
            const row = payload[0]?.payload as ChartRow | undefined;
            return active && row ? (
              <ChartTooltip
                row={row}
                series={SERIES}
                hidden={hidden}
                suffix={` ${unit}`}
                dateFormat={dateFormat}
              />
            ) : null;
          }}
          cursor={{ stroke: "var(--chart-axis)" }}
          isAnimationActive={false}
        />
        {SERIES.flatMap((series) =>
          linesFor(series.key).map(({ dataKey, opacity }) => (
            <Line
              key={dataKey}
              dataKey={dataKey}
              name={series.name}
              // Hidden lines leave the y-axis too, so it rescales to fit the
              // lines that are left.
              hide={hidden.has(series.key)}
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
      </LineChart>
      <ChartLegend series={SERIES} hidden={hidden} onToggle={toggle} />
      <p className={styles.note}>
        Faded parts of the weight line are estimated days.
      </p>
    </section>
  );
}
