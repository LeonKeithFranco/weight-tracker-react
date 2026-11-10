import type { ChartRow } from "../lib/chartRows";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { WEIGHT_DECIMALS } from "../lib/units";
import { ChartCard } from "./ChartCard";
import type { ChartRowSeries } from "./ChartTooltip";
import { ProgressPlot } from "./lazyPlots";
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
  const { hidden, toggle } = useHiddenSeries();
  // Without a target there's nothing to lose towards, so only the loss shows.
  // The first series is drawn at the bottom of the stack.
  const series = hasTarget ? [LOST, TO_LOSE] : [LOST];

  return (
    <ChartCard
      title={`Progress (${unit})`}
      legendItems={series}
      hidden={hidden}
      onToggle={toggle}
    >
      <ProgressPlot
        rows={rows}
        series={series}
        hidden={hidden}
        suffix={` ${unit}`}
        dateFormat={dateFormat}
      />
    </ChartCard>
  );
}
