import type { ChartRow } from "../lib/chartRows";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { AVERAGE_DECIMALS } from "../lib/units";
import { ChartCard } from "./ChartCard";
import type { ChartRowSeries } from "./ChartTooltip";
import { LossRatePlot } from "./lazyPlots";

const SERIES: ChartRowSeries[] = [
  {
    key: "weightLossPerWeek",
    name: FIGURE_LABELS.weightLossPerWeekKg,
    color: "var(--series-1)",
    dashed: false,
    decimals: AVERAGE_DECIMALS,
  },
];

/** Nothing is ever hidden, because hiding the only line would empty the chart. */
const NONE_HIDDEN: ReadonlySet<string> = new Set();

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
  dateFormat: string;
};

/**
 * The average loss per week since the start. One line, so its legend is
 * plain text rather than a button to hide it.
 */
export function LossRateChart({ rows, unit, dateFormat }: Props) {
  return (
    <ChartCard
      title={`Loss rate (${unit} per week)`}
      legendItems={SERIES}
      hidden={NONE_HIDDEN}
    >
      <LossRatePlot
        rows={rows}
        series={SERIES}
        hidden={NONE_HIDDEN}
        suffix={` ${unit}`}
        dateFormat={dateFormat}
      />
    </ChartCard>
  );
}
