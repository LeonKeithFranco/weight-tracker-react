import type { ChartRow } from "../lib/chartRows";
import { FIGURE_LABELS } from "../lib/figureLabels";
import { PERCENT_DECIMALS } from "../lib/units";
import { ChartCard } from "./ChartCard";
import type { LegendItem } from "./ChartLegend";
import type { ChartRowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";
import { WeeklyChangePlot } from "./chartPlots";

const SERIES: ChartRowSeries[] = [
  {
    key: "average7ChangePercent",
    name: FIGURE_LABELS.average7Change,
    color: "var(--chart-loss)",
    dashed: false,
    decimals: PERCENT_DECIMALS,
  },
];

/** The legend shows the two bar colours rather than the one series. */
const LEGEND: LegendItem[] = [
  {
    key: "loss",
    name: "Loss",
    color: "var(--chart-loss)",
    dashed: false,
    marker: "square",
  },
  {
    key: "gain",
    name: "Gain",
    color: "var(--chart-gain)",
    dashed: false,
    marker: "square",
  },
];

/** Nothing is ever hidden, because a single series can't be toggled off. */
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
    <ChartCard
      title="Weekly change (%)"
      legendItems={LEGEND}
      hidden={NONE_HIDDEN}
      footer={
        <p className={styles.note}>
          Blue bars below 0 mean the 7-day average is lower than a week earlier.
          Red bars above 0 mean it's higher.
        </p>
      }
    >
      <WeeklyChangePlot
        rows={rows}
        series={SERIES}
        hidden={NONE_HIDDEN}
        suffix="%"
        dateFormat={dateFormat}
      />
    </ChartCard>
  );
}
