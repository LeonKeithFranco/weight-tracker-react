import { useId, useState } from "react";
import { useData } from "../data/dataContext";
import { formatDate } from "../lib/dates";
import type { WeightEntry } from "../lib/types";
import { formatWeight } from "../lib/units";
import styles from "./dialog.module.css";
import formStyles from "./forms.module.css";
import { useModal } from "./useModal";

/** The props for {@link DeleteEntryDialog}. */
type DeleteEntryDialogProps = {
  /** The saved entry to delete. */
  entry: WeightEntry;
  /** Called once the dialog has closed, however it was closed. */
  onClose(): void;
};

/**
 * Asks before deleting a saved entry, because deleting can't be undone. It's
 * a modal dialog that opens as soon as it's drawn, with Cancel focused first.
 */
export function DeleteEntryDialog({ entry, onClose }: DeleteEntryDialogProps) {
  const { settings, deleteEntry } = useData();
  const dialogRef = useModal();
  const id = useId();
  const [deleteState, setDeleteState] = useState<
    "idle" | "deleting" | "failed"
  >("idle");
  const unit = settings.displayUnit;
  const date = formatDate(entry.date, settings.dateFormat);

  function close() {
    dialogRef.current?.close();
  }

  async function handleDelete() {
    setDeleteState("deleting");
    try {
      await deleteEntry(entry.date);
      close();
    } catch {
      setDeleteState("failed");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-message`}
    >
      <h2 id={`${id}-heading`}>Delete {date}?</h2>
      <p id={`${id}-message`} className={styles.message}>
        This deletes {formatWeight(entry.weightKg, unit)} {unit} for {date}. It
        can&apos;t be undone.
      </p>

      {deleteState === "failed" && (
        <p role="alert" className={formStyles.error}>
          Couldn&apos;t delete. Try again.
        </p>
      )}

      <div className={styles.buttons}>
        {/* First, so it gets focus when the dialog opens, and pressing Enter
            straight away doesn't delete anything. */}
        <button type="button" onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.danger}
          onClick={handleDelete}
          disabled={deleteState === "deleting"}
        >
          Delete
        </button>
      </div>
    </dialog>
  );
}
