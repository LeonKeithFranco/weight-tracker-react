import { useId, useMemo } from "react";
import { useData } from "../data/dataContext";
import { useDailyFigures } from "../data/useDailyFigures";
import { formatDate } from "../lib/dates";
import { FIGURE_LABELS } from "../lib/figureLabels";
import { estimateGoalDate, type GoalEstimate } from "../lib/goalDate";
import { formatAverage, formatPercent, formatWeight } from "../lib/units";
import styles from "./LatestFigures.module.css";

/** The goal date row's text, from the display table in `docs/SPEC.md`. */
function describeGoal(goal: GoalEstimate, dateFormat: string): string | null {
  switch (goal.status) {
    case "no-target":
      return null;
    case "not-enough-data":
      return "Not enough data";
    case "target-reached":
      return "Target reached";
    case "no-estimate":
      return "No estimate";
    case "estimated":
      return formatDate(goal.date, dateFormat);
  }
}

/** The latest day's figures and the goal date estimate. */
export function LatestFigures() {
  const { settings } = useData();
  const figures = useDailyFigures();
  const headingId = useId();
  const goal = useMemo(
    () => estimateGoalDate(figures, settings.targetWeightKg),
    [figures, settings.targetWeightKg],
  );

  const latest = figures.at(-1);
  if (latest === undefined) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId}>Latest figures</h2>
        <p>No entries yet. Log your first weight above.</p>
      </section>
    );
  }

  const unit = settings.displayUnit;
  const goalText = describeGoal(goal, settings.dateFormat);

  const rows: { term: string; value: string }[] = [
    {
      term: FIGURE_LABELS.weightKg,
      value: `${formatWeight(latest.weightKg, unit)} ${unit}`,
    },
    {
      term: FIGURE_LABELS.average7Kg,
      value: `${formatAverage(latest.average7Kg, unit)} ${unit}`,
    },
    {
      term: FIGURE_LABELS.average7Change,
      value: formatPercent(latest.average7Change),
    },
    {
      term: FIGURE_LABELS.average28Kg,
      value: `${formatAverage(latest.average28Kg, unit)} ${unit}`,
    },
    {
      term: FIGURE_LABELS.lowestWeightKg,
      value: `${formatWeight(latest.lowestWeightKg, unit)} ${unit}`,
    },
    ...(latest.weightToLoseKg === null
      ? []
      : [
          {
            term: FIGURE_LABELS.weightToLoseKg,
            value: `${formatWeight(latest.weightToLoseKg, unit)} ${unit}`,
          },
        ]),
    {
      term: FIGURE_LABELS.weightLossSinceStartKg,
      value: `${formatWeight(latest.weightLossSinceStartKg, unit)} ${unit}`,
    },
    {
      term: FIGURE_LABELS.weightLossPerWeekKg,
      value: `${formatAverage(latest.weightLossPerWeekKg, unit)} ${unit}`,
    },
    ...(goalText === null ? [] : [{ term: "Goal date", value: goalText }]),
  ];

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Latest figures</h2>
      <p className={styles.asOf}>
        As of {formatDate(latest.date, settings.dateFormat)}
      </p>
      <dl className={styles.figures}>
        {rows.map(({ term, value }) => (
          <div key={term} className={styles.row}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
