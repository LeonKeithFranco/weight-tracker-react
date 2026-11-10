import { Pencil, Trash2 } from "lucide-react";
import type { DailyFigures, WeightEntry } from "../lib/types";
import styles from "./EntryActions.module.css";

/** The props for {@link EntryActions}. */
type EntryActionsProps = {
  /** The day the buttons are for. An estimated day gets no buttons. */
  day: DailyFigures;
  /** The date as shown, so each button's name says which day it's for. */
  shownDate: string;
  /**
   * Shows only the icons, for the table, where every row has these buttons.
   * The words stay for screen readers and in a tooltip.
   */
  iconsOnly?: boolean;
  /** Called with the day's saved entry when Edit is pressed. */
  onEdit(entry: WeightEntry): void;
  /** Called with the day's saved entry when Delete is pressed. */
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
  iconsOnly = false,
  onEdit,
  onDelete,
}: EntryActionsProps) {
  if (day.isEstimated) {
    return null;
  }

  const entry: WeightEntry = { date: day.date, weightKg: day.weightKg };
  // The word is hidden on screen in the table, but still part of the
  // button's name, so a screen reader hears "Edit 2026-11-03" either way.
  const wordClass = iconsOnly ? "visually-hidden" : undefined;

  return (
    <div className={iconsOnly ? styles.iconActions : styles.actions}>
      {/* Every row has these buttons, so the hidden date tells them apart for
          screen readers, as "Edit 2026-11-03". The space sits outside the
          span, because each element's text is trimmed when names are worked
          out. The icons are decoration, since the words name the buttons. */}
      <button
        type="button"
        onClick={() => onEdit(entry)}
        title={iconsOnly ? `Edit ${shownDate}` : undefined}
      >
        <Pencil aria-hidden size={16} />
        <span className={wordClass}>Edit</span>{" "}
        <span className="visually-hidden">{shownDate}</span>
      </button>
      <button
        type="button"
        onClick={() => onDelete(entry)}
        title={iconsOnly ? `Delete ${shownDate}` : undefined}
      >
        <Trash2 aria-hidden size={16} />
        <span className={wordClass}>Delete</span>{" "}
        <span className="visually-hidden">{shownDate}</span>
      </button>
    </div>
  );
}
