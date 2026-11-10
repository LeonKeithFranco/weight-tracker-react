import { useId, useState } from "react";
import { useData } from "../data/dataContext";
import { formatDate } from "../lib/dates";
import { columnHeading, figureColumns } from "../lib/figureColumns";
import type { DailyFigures, Settings, WeightEntry } from "../lib/types";
import { formatAverage, formatWeight } from "../lib/units";
import { EntryActions } from "./EntryActions";
import { EstimatedPill } from "./EstimatedPill";
import styles from "./FiguresList.module.css";
import { toneClass } from "./toneClass";

/** The props for {@link FiguresList}. */
type FiguresListProps = {
  /** The days to show, in the order to show them. */
  days: DailyFigures[];
  /** Called with a day's saved entry when its Edit button is pressed. */
  onEdit(entry: WeightEntry): void;
  /** Called with a day's saved entry when its Delete button is pressed. */
  onDelete(entry: WeightEntry): void;
};

/**
 * A compact row per day for phones, with the date, weight and 7-day average.
 * Tapping a row shows every figure, and the buttons for a saved entry.
 */
export function FiguresList({ days, onEdit, onDelete }: FiguresListProps) {
  const { settings } = useData();
  const unit = settings.displayUnit;

  return (
    <>
      {/* Labels the columns for sighted users. Screen readers get a label
          inside each row instead, so this is hidden from them. */}
      <div className={`${styles.summary} ${styles.labels}`} aria-hidden="true">
        <span>Date</span>
        <span>Weight ({unit})</span>
        <span>7-day avg ({unit})</span>
      </div>
      <ul className={styles.list} aria-label="Daily figures, newest first">
        {days.map((day) => (
          // The key keeps each row's open or closed state with its own date,
          // even when a new day is added at the top.
          <DayRow
            key={day.date}
            day={day}
            settings={settings}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </>
  );
}

/** The props for {@link DayRow}. */
type DayRowProps = {
  /** The day the row shows. */
  day: DailyFigures;
  /** The settings, for the unit, date format and whether a target is set. */
  settings: Settings;
  /** Called with the day's saved entry when Edit is pressed. */
  onEdit(entry: WeightEntry): void;
  /** Called with the day's saved entry when Delete is pressed. */
  onDelete(entry: WeightEntry): void;
};

/** One day: a button that shows and hides the rest of its figures. */
function DayRow({ day, settings, onEdit, onDelete }: DayRowProps) {
  // Each row keeps its own state, so opening one doesn't re-render the others.
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const unit = settings.displayUnit;
  const shownDate = formatDate(day.date, settings.dateFormat);

  return (
    <li className={day.isEstimated ? styles.estimated : undefined}>
      <button
        type="button"
        className={`${styles.summary} ${styles.toggle}`}
        onClick={() => setExpanded((current) => !current)}
        // Tells screen readers whether the row is open, and which part it opens.
        aria-expanded={expanded}
        aria-controls={expanded ? panelId : undefined}
      >
        <span className={styles.date}>
          {shownDate}
          {day.isEstimated && <EstimatedPill />}
        </span>
        <span>
          <span className="visually-hidden">Weight </span>
          {formatWeight(day.weightKg, unit)}
        </span>
        <span>
          <span className="visually-hidden">7-day average </span>
          {formatAverage(day.average7Kg, unit)}
        </span>
      </button>

      {/* Only drawn when open, so hundreds of closed rows stay light. */}
      {expanded && (
        <div id={panelId} className={styles.panel}>
          <dl className={styles.details}>
            {figureColumns(settings.targetWeightKg !== null).map((column) => (
              <div key={column.key} className={styles.detail}>
                <dt>{columnHeading(column, unit)}</dt>
                <dd className={toneClass(column, day)}>
                  {column.format(day, unit)}
                </dd>
              </div>
            ))}
          </dl>
          <EntryActions
            day={day}
            shownDate={shownDate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </li>
  );
}
