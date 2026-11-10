import type { ChartRow } from "../lib/chartRows";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { AVERAGE_DECIMALS, WEIGHT_DECIMALS } from "../lib/units";
import { ChartCard } from "./ChartCard";
import type { ChartRowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";
import { WeightTrendsPlot } from "./chartPlots";
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

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
  dateFormat: string;
};

export function WeightTrendsChart({ rows, unit, dateFormat }: Props) {
  const { hidden, toggle } = useHiddenSeries();

  return (
    <ChartCard
      title={`Weight trends (${unit})`}
      legendItems={SERIES}
      hidden={hidden}
      onToggle={toggle}
      footer={
        <p className={styles.note}>
          Faded parts of the weight line are estimated days.
        </p>
      }
    >
      <WeightTrendsPlot
        rows={rows}
        series={SERIES}
        hidden={hidden}
        suffix={` ${unit}`}
        dateFormat={dateFormat}
      />
    </ChartCard>
  );
}
