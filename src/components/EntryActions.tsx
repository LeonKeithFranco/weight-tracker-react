import type { DailyFigures, WeightEntry } from "../lib/types";
import styles from "./EntryActions.module.css";

type EntryActionsProps = {
  day: DailyFigures;
  /** The date as shown, so each button's name says which day it's for. */
  shownDate: string;
  onEdit(entry: WeightEntry): void;
};

/**
 * The buttons for a saved entry, shared by the table and the phone rows.
 * Estimated days get none, because there's no entry to change. Logging that
 * date on Home makes it a real entry.
 */
export function EntryActions({ day, shownDate, onEdit }: EntryActionsProps) {
  if (day.isEstimated) {
    return null;
  }

  return (
    <div className={styles.actions}>
      <button
        type="button"
        onClick={() => onEdit({ date: day.date, weightKg: day.weightKg })}
      >
        {/* Every row has an Edit button, so the hidden date tells them apart
            for screen readers, as "Edit 2026-11-03". */}
        Edit <span className="visually-hidden">{shownDate}</span>
      </button>
    </div>
  );
}
