import { useData } from "../data/dataContext";
import { formatDate } from "../lib/dates";
import { columnGroups, figureColumns } from "../lib/figureColumns";
import type { DailyFigures, WeightEntry } from "../lib/types";
import { EntryActions } from "./EntryActions";
import { EstimatedPill } from "./EstimatedPill";
import styles from "./FiguresTable.module.css";
import { toneClass } from "./toneClass";

/** The props for {@link FiguresTable}. */
type FiguresTableProps = {
  /** The days to show, in the order to show them. */
  days: DailyFigures[];
  /** Called with a day's saved entry when its Edit button is pressed. */
  onEdit(entry: WeightEntry): void;
  /** Called with a day's saved entry when its Delete button is pressed. */
  onDelete(entry: WeightEntry): void;
};

/**
 * Every figure for every day, one row per day, for wide screens. The averages
 * share grouped headings, and "Left to lose" is left out without a target.
 */
export function FiguresTable({ days, onEdit, onDelete }: FiguresTableProps) {
  const { settings } = useData();
  const unit = settings.displayUnit;
  const columns = figureColumns(settings.targetWeightKg !== null);
  const groups = columnGroups(columns);

  return (
    // Scrolls on its own in both directions, so the headings can stay in view.
    <div className={styles.scroll} tabIndex={0}>
      <table className={styles.table}>
        {/* The unit is here once rather than in every heading. The change
            column's values carry their own "%". */}
        <caption>Daily figures in {unit}, newest first</caption>
        {/* Tells the browser which columns form a group, which a heading
            with `scope="colgroup"` needs so screen readers can announce it
            with each value, such as "7-day average, Lowest, 195.10". */}
        <colgroup span={1} />
        {groups.map((group) => (
          <colgroup key={group.columns[0].key} span={group.columns.length} />
        ))}
        <colgroup span={1} />
        <thead>
          <tr>
            {/* Spans both heading rows, as do the columns with no group. */}
            <th scope="col" rowSpan={2}>
              Date
            </th>
            {groups.map((group) =>
              group.label === null ? (
                <th key={group.columns[0].key} scope="col" rowSpan={2}>
                  {group.columns[0].label}
                </th>
              ) : (
                <th
                  key={group.columns[0].key}
                  scope="colgroup"
                  colSpan={group.columns.length}
                  className={styles.groupHeading}
                >
                  {group.label}
                </th>
              ),
            )}
            <th scope="col" rowSpan={2}>
              {/* The buttons explain themselves, so the heading is only for screen readers. */}
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
          <tr>
            {columns.flatMap((column) =>
              column.group
                ? [
                    <th key={column.key} scope="col">
                      {column.group.subLabel}
                    </th>,
                  ]
                : [],
            )}
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
                  {day.isEstimated && <EstimatedPill className={styles.pill} />}
                </th>
                {columns.map((column) => (
                  <td key={column.key} className={toneClass(column, day)}>
                    {column.format(day, unit)}
                  </td>
                ))}
                <td>
                  <EntryActions
                    day={day}
                    shownDate={shownDate}
                    iconsOnly
                    onEdit={onEdit}
                    onDelete={onDelete}
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
