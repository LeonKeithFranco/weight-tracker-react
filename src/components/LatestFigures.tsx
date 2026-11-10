import NumberFlow, { continuous, NumberFlowGroup } from "@number-flow/react";
import { useId, useMemo } from "react";
import { useData } from "../data/dataContext";
import { useDailyFigures } from "../data/useDailyFigures";
import { formatDate } from "../lib/dates";
import { FIGURE_LABELS } from "../lib/figureLabels";
import { estimateGoalDate, type GoalEstimate } from "../lib/goalDate";
import {
  AVERAGE_DECIMALS,
  formatNumber,
  fromKg,
  numberFormatOptions,
  PERCENT_DECIMALS,
  roundForDisplay,
  WEIGHT_DECIMALS,
} from "../lib/units";
import styles from "./LatestFigures.module.css";
import { RollingDate } from "./RollingDate";

/** Counts through the values in between, so the right-hand digits spin fastest. */
const PLUGINS = [continuous];

/** A figure shown as a rolling number, in the display unit or as a percentage. */
type NumberRow = {
  term: string;
  value: number;
  decimals: number;
  suffix: string;
};

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
  const asOfText = formatDate(latest.date, settings.dateFormat);

  function weightRow(
    term: string,
    weightKg: number,
    decimals: number,
  ): NumberRow {
    return {
      term,
      value: fromKg(weightKg, unit),
      decimals,
      suffix: ` ${unit}`,
    };
  }

  const rows: NumberRow[] = [
    weightRow(FIGURE_LABELS.weightKg, latest.weightKg, WEIGHT_DECIMALS),
    weightRow(FIGURE_LABELS.average7Kg, latest.average7Kg, AVERAGE_DECIMALS),
    {
      term: FIGURE_LABELS.average7Change,
      value: latest.average7Change * 100,
      decimals: PERCENT_DECIMALS,
      suffix: "%",
    },
    weightRow(FIGURE_LABELS.average28Kg, latest.average28Kg, AVERAGE_DECIMALS),
    weightRow(
      FIGURE_LABELS.lowestWeightKg,
      latest.lowestWeightKg,
      WEIGHT_DECIMALS,
    ),
    ...(latest.weightToLoseKg === null
      ? []
      : [
          weightRow(
            FIGURE_LABELS.weightToLoseKg,
            latest.weightToLoseKg,
            WEIGHT_DECIMALS,
          ),
        ]),
    weightRow(
      FIGURE_LABELS.weightLossSinceStartKg,
      latest.weightLossSinceStartKg,
      WEIGHT_DECIMALS,
    ),
    weightRow(
      FIGURE_LABELS.weightLossPerWeekKg,
      latest.weightLossPerWeekKg,
      AVERAGE_DECIMALS,
    ),
  ];

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Latest figures</h2>
      <p className={styles.asOf}>
        <span className="visually-hidden">As of {asOfText}</span>
        <span aria-hidden="true">
          As of <RollingDate text={asOfText} order={latest.date} />
        </span>
      </p>
      {/* The group keeps the figures' animations in step with each other. */}
      <NumberFlowGroup>
        <dl className={styles.figures}>
          {rows.map(({ term, value, decimals, suffix }) => (
            <div key={term} className={styles.row}>
              <dt>{term}</dt>
              <dd>
                {/* NumberFlow draws its digits where screen readers and
                    tests can't reliably read them, so the plain text is
                    here for them, and the rolling copy is hidden from them. */}
                <span className="visually-hidden">
                  {formatNumber(value, decimals)}
                  {suffix}
                </span>
                <NumberFlow
                  aria-hidden="true"
                  value={roundForDisplay(value, decimals)}
                  locales="en-US"
                  format={numberFormatOptions(decimals)}
                  suffix={suffix}
                  plugins={PLUGINS}
                />
              </dd>
            </div>
          ))}
          {goalText !== null && (
            <div className={styles.row}>
              <dt>Goal date</dt>
              <dd>
                <span className="visually-hidden">{goalText}</span>
                <RollingDate
                  text={goalText}
                  order={goal.status === "estimated" ? goal.date : null}
                />
              </dd>
            </div>
          )}
        </dl>
      </NumberFlowGroup>
    </section>
  );
}
