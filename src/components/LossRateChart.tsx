import { useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { formatChartLabel } from "../lib/dates";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { AVERAGE_DECIMALS } from "../lib/units";
import { ChartTooltip, type ChartRowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";

const SERIES: ChartRowSeries[] = [
  {
    key: "weightLossPerWeek",
    name: FIGURE_LABELS.weightLossPerWeekKg,
    color: "var(--series-1)",
    dashed: false,
    decimals: AVERAGE_DECIMALS,
  },
];

/** Nothing is ever hidden, because a single line has no legend to hide it. */
const NONE_HIDDEN: ReadonlySet<string> = new Set();

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
  dateFormat: string;
};

/**
 * The average loss per week since the start. One line, so the heading names
 * it and there's no legend.
 */
export function LossRateChart({ rows, unit, dateFormat }: Props) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Loss rate ({unit} per week)</h2>
      <LineChart className={styles.chart} data={rows} responsive>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatChartLabel}
          stroke="var(--chart-axis)"
          minTickGap={24}
        />
        {/* Fits the data, since the rate settles well away from 0 after the
            first few weeks. */}
        <YAxis
          domain={["auto", "auto"]}
          stroke="var(--chart-axis)"
          width="auto"
        />
        {/* Below 0 means weight gained since the start. Only shows when the
            axis reaches 0. */}
        <ReferenceLine y={0} stroke="var(--chart-axis)" />
        <Tooltip
          content={({ active, payload }) => {
            const row = payload[0]?.payload as ChartRow | undefined;
            return active && row ? (
              <ChartTooltip
                row={row}
                series={SERIES}
                hidden={NONE_HIDDEN}
                suffix={` ${unit}`}
                dateFormat={dateFormat}
              />
            ) : null;
          }}
          cursor={{ stroke: "var(--chart-axis)" }}
          isAnimationActive={false}
        />
        <Line
          dataKey="weightLossPerWeek"
          name={SERIES[0].name}
          stroke={SERIES[0].color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          type="linear"
          isAnimationActive={false}
        />
      </LineChart>
    </section>
  );
}
