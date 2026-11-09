import { useData } from "../data/dataContext";
import { formatDate } from "../lib/dates";
import { columnHeading, figureColumns } from "../lib/figureColumns";
import type { DailyFigures } from "../lib/types";
import styles from "./FiguresTable.module.css";

type FiguresTableProps = {
  /** The days to show, in the order to show them. */
  days: DailyFigures[];
};

/** Every figure for every day, one row per day, for wide screens. */
export function FiguresTable({ days }: FiguresTableProps) {
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
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            // There's one row per date, so the date identifies the row.
            <tr
              key={day.date}
              className={day.isEstimated ? styles.estimated : undefined}
            >
              {/* A row header, so screen readers announce the date with each value. */}
              <th scope="row">
                {formatDate(day.date, settings.dateFormat)}
                {day.isEstimated && (
                  <span className={styles.estimatedLabel}>Estimated</span>
                )}
              </th>
              {columns.map((column) => (
                <td key={column.key}>{column.format(day, unit)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
