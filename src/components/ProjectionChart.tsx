import { useId } from "react";
import { FIGURE_LABELS } from "../lib/figureLabels";
import { toProjectionRows, type ProjectionRow } from "../lib/projectionRows";
import type { ProjectedDay } from "../lib/projectedRange";
import type { DailyPoint, WeightUnit } from "../lib/types";
import { WEIGHT_DECIMALS } from "../lib/units";
import { ChartCard } from "./ChartCard";
import type { RowSeries } from "./ChartTooltip";
import styles from "./chart.module.css";
import { ProjectionPlot } from "./lazyPlots";
import { useHiddenSeries } from "./useHiddenSeries";

/** The recent days' weight, which the projection learned from. */
const WEIGHT: RowSeries<ProjectionRow> = {
  key: "weight",
  name: FIGURE_LABELS.weightKg,
  color: "var(--series-1)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

/**
 * The projected trend. It shares its range's colour, so the two read as one
 * projection.
 */
const TREND: RowSeries<ProjectionRow> = {
  key: "trend",
  name: "Projected trend",
  color: "var(--series-2)",
  dashed: true,
  decimals: WEIGHT_DECIMALS,
};

/** The likely range, drawn as a band around the trend. */
const RANGE: RowSeries<ProjectionRow> = {
  key: "range",
  name: "Likely range",
  color: "var(--series-2)",
  dashed: false,
  decimals: WEIGHT_DECIMALS,
};

/** The target weight, as a flat line. Only shown with a target. */
const TARGET: RowSeries<ProjectionRow> = {
  key: "target",
  name: "Target",
  color: "var(--series-3)",
  dashed: true,
  decimals: WEIGHT_DECIMALS,
};

/** The props for {@link ProjectionChart}. */
type Props = {
  /** The whole daily series, oldest first, in kg. */
  series: DailyPoint[];
  /**
   * The projected days, or `null` when there aren't enough days to project
   * from, which shows a message in place of the chart.
   */
  projected: ProjectedDay[] | null;
  /** The display unit to convert weights to. */
  unit: WeightUnit;
  /** The date format setting, for the tooltip. */
  dateFormat: string;
  /** The target weight in kg, or `null` when none is set. */
  targetWeightKg: number | null;
};

/**
 * Where the weight might go over the next 180 days, from the size of recent
 * day-to-day changes: the trend, and the range two standard deviations
 * either side of it, which widens with time.
 */
export function ProjectionChart({
  series,
  projected,
  unit,
  dateFormat,
  targetWeightKg,
}: Props) {
  const { hidden, toggle } = useHiddenSeries();
  const headingId = useId();
  const title = `Projection (${unit})`;

  if (projected === null) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId}>{title}</h2>
        <p>Not enough data. The projection needs at least 14 days.</p>
      </section>
    );
  }

  const rows = toProjectionRows(series, projected, unit, targetWeightKg);
  // Without a target, the target line is left out, as the spec says.
  const legend =
    targetWeightKg === null
      ? [WEIGHT, TREND, RANGE]
      : [WEIGHT, TREND, RANGE, TARGET];

  return (
    <ChartCard
      title={title}
      legendItems={legend}
      hidden={hidden}
      onToggle={toggle}
      footer={
        <p className={styles.note}>
          The last 90 days, then 180 projected days. The trend continues the
          average daily change, and the range reaches 2 standard deviations of
          daily changes either side, so about 95% likely. It doesn&apos;t follow
          the range presets, which only cover the past.
        </p>
      }
    >
      <ProjectionPlot
        rows={rows}
        series={legend}
        hidden={hidden}
        suffix={` ${unit}`}
        dateFormat={dateFormat}
      />
    </ChartCard>
  );
}
