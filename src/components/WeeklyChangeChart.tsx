import { Bar, BarChart, Cell, ReferenceLine } from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { FIGURE_LABELS } from "../lib/figureLabels";
import { PERCENT_DECIMALS } from "../lib/units";
import { ChartFrame } from "./ChartFrame";
import type { ChartRowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";

const SERIES: ChartRowSeries[] = [
  {
    key: "average7ChangePercent",
    name: FIGURE_LABELS.average7Change,
    color: "var(--chart-loss)",
    dashed: false,
    decimals: PERCENT_DECIMALS,
  },
];

/** Nothing is ever hidden, because a single series has no legend to hide it. */
const NONE_HIDDEN: ReadonlySet<string> = new Set();

type Props = {
  rows: ChartRow[];
  dateFormat: string;
};

/**
 * How the 7-day average compares with a week earlier, as one bar per day.
 * Bars below 0 are losses and above 0 are gains, and each direction has its
 * own colour as well, so the sign doesn't rely on position alone.
 */
export function WeeklyChangeChart({ rows, dateFormat }: Props) {
  return (
    <ChartFrame
      title="Weekly change (%)"
      chart={BarChart}
      rows={rows}
      series={SERIES}
      hidden={NONE_HIDDEN}
      suffix="%"
      dateFormat={dateFormat}
      yTickFormatter={(value) => `${value}%`}
      footer={
        <p className={styles.note}>
          Blue bars below 0 mean the 7-day average is lower than a week earlier.
          Red bars above 0 mean it's higher.
        </p>
      }
    >
      <ReferenceLine y={0} stroke="var(--chart-axis)" />
      <Bar
        dataKey="average7ChangePercent"
        name={SERIES[0].name}
        isAnimationActive={false}
      >
        {/* One cell per row, in the same order, so each bar gets the colour
            for its own direction. */}
        {rows.map((row) => (
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
    </ChartFrame>
  );
}
