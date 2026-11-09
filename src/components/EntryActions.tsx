import type { DailyFigures, WeightEntry } from "../lib/types";
import styles from "./EntryActions.module.css";

type EntryActionsProps = {
  day: DailyFigures;
  /** The date as shown, so each button's name says which day it's for. */
  shownDate: string;
  onEdit(entry: WeightEntry): void;
  onDelete(entry: WeightEntry): void;
};

/**
 * The buttons for a saved entry, shared by the table and the phone rows.
 * Estimated days get none, because there's no entry to change. Logging that
 * date on Home makes it a real entry.
 */
export function EntryActions({
  day,
  shownDate,
  onEdit,
  onDelete,
}: EntryActionsProps) {
  if (day.isEstimated) {
    return null;
  }

  const entry: WeightEntry = { date: day.date, weightKg: day.weightKg };

  return (
    <div className={styles.actions}>
      {/* Every row has these buttons, so the hidden date tells them apart for
          screen readers, as "Edit 2026-11-03". The space sits outside the
          span, because each element's text is trimmed when names are worked
          out. */}
      <button type="button" onClick={() => onEdit(entry)}>
        Edit <span className="visually-hidden">{shownDate}</span>
      </button>
      <button type="button" onClick={() => onDelete(entry)}>
        Delete <span className="visually-hidden">{shownDate}</span>
      </button>
    </div>
  );
}
