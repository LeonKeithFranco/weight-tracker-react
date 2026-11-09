import { useData } from "../data/dataContext";
import { formatDate } from "../lib/dates";
import { columnHeading, figureColumns } from "../lib/figureColumns";
import type { DailyFigures, WeightEntry } from "../lib/types";
import { EntryActions } from "./EntryActions";
import styles from "./FiguresTable.module.css";

type FiguresTableProps = {
  /** The days to show, in the order to show them. */
  days: DailyFigures[];
  onEdit(entry: WeightEntry): void;
};

/** Every figure for every day, one row per day, for wide screens. */
export function FiguresTable({ days, onEdit }: FiguresTableProps) {
  const { settings } = useData();
  const unit = settings.displayUnit;
  const columns = figureColumns(settings.targetWeightKg !== null);

  return (
    // Scrolls on its own in both directions, so the headings can stay in view.
    <div className={styles.scroll} tabIndex={0}>
      <table className={styles.table}>
        <caption>Daily figures, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {columnHeading(column, unit)}
              </th>
            ))}
            <th scope="col">
              {/* The buttons explain themselves, so the heading is only for screen readers. */}
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const shownDate = formatDate(day.date, settings.dateFormat);
            return (
              // There's one row per date, so the date identifies the row.
              <tr
                key={day.date}
                className={day.isEstimated ? styles.estimated : undefined}
              >
                {/* A row header, so screen readers announce the date with each value. */}
                <th scope="row">
                  {shownDate}
                  {day.isEstimated && (
                    <span className={styles.estimatedLabel}>Estimated</span>
                  )}
                </th>
                {columns.map((column) => (
                  <td key={column.key}>{column.format(day, unit)}</td>
                ))}
                <td>
                  <EntryActions
                    day={day}
                    shownDate={shownDate}
                    onEdit={onEdit}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
