import { useProjection } from "../data/useProjection";
import type { ChartRow } from "../lib/chartRows";
import type { WeightUnit } from "../lib/types";
import { Card } from "./Card";
import { LossRateChart } from "./LossRateChart";
import { ProgressChart } from "./ProgressChart";
import { ProjectionChart } from "./ProjectionChart";
import { WeeklyChangeChart } from "./WeeklyChangeChart";
import { WeightTrendsChart } from "./WeightTrendsChart";

/** The props for {@link ChartCards}. */
type Props = {
  /** The days the range preset shows, already in the display unit. */
  rows: ChartRow[];
  /**
   * The display unit, for the charts' headings and tooltips, and for converting
   * the projection's weights.
   */
  unit: WeightUnit;
  /** The date format setting, for the tooltips' dates. */
  dateFormat: string;
  /**
   * The target weight in kg, or `null` when none is set, which hides the
   * Projection chart's target line and the Progress chart's weight to lose.
   */
  targetWeightKg: number | null;
};

/**
 * Every chart, each in its own card. The cards load with the app, and only
 * their plots, which use Recharts, load in a separate file.
 */
export function ChartCards({ rows, unit, dateFormat, targetWeightKg }: Props) {
  const projection = useProjection();
  // What every chart needs, passed with one spread.
  const chartProps = { rows, unit, dateFormat };

  // A fragment, so the cards sit directly in the screen's layout and its gap
  // spaces them.
  return (
    <>
      <Card>
        <WeightTrendsChart {...chartProps} />
      </Card>
      <Card>
        <ProgressChart {...chartProps} hasTarget={targetWeightKg !== null} />
      </Card>
      <Card>
        <LossRateChart {...chartProps} />
      </Card>
      <Card>
        {/* A percentage has no unit, so only the rows and date format. */}
        <WeeklyChangeChart rows={rows} dateFormat={dateFormat} />
      </Card>
      <Card>
        {/* Uses its own window rather than the preset, so it gets the
            whole series and its projected range. */}
        <ProjectionChart
          {...projection}
          unit={unit}
          dateFormat={dateFormat}
          targetWeightKg={targetWeightKg}
        />
      </Card>
    </>
  );
}
