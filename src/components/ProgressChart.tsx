import type { ChartRow } from "../lib/chartRows";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { WEIGHT_DECIMALS } from "../lib/units";
import { ChartCard } from "./ChartCard";
import type { ChartRowSeries } from "./ChartTooltip";
import { ProgressPlot } from "./lazyPlots";
import { useHiddenSeries } from "./useHiddenSeries";

/** The weight still to lose, stacked on top. Only shown with a target. */
const TO_LOSE: ChartRowSeries = {
  key: "weightToLose",
  name: FIGURE_LABELS.weightToLoseKg,
  color: "var(--series-1)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

/** The weight lost since the start, at the bottom of the stack. */
const LOST: ChartRowSeries = {
  key: "weightLossSinceStart",
  name: FIGURE_LABELS.weightLossSinceStartKg,
  color: "var(--series-2)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

/** The props for {@link ProgressChart}. */
type Props = {
  /** The days the range preset shows, in the display unit. */
  rows: ChartRow[];
  /** The display unit, for the heading and the tooltip. */
  unit: WeightUnit;
  /** The date format setting, for the tooltip. */
  dateFormat: string;
  /** Whether a target is set. Without one, only the weight lost is shown. */
  hasTarget: boolean;
};

/**
 * How far you've come, with how far there is to go stacked on top. Until the
 * target is reached, the two add up to the start weight minus the target, so
 * the stack stays the same height and the split between the colours shows the
 * progress. Past the target, the extra hangs below 0.
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
