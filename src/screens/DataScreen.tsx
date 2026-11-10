import { useState } from "react";
import { Card } from "../components/Card";
import { DeleteEntryDialog } from "../components/DeleteEntryDialog";
import { EditEntryDialog } from "../components/EditEntryDialog";
import { FiguresList } from "../components/FiguresList";
import { FiguresTable } from "../components/FiguresTable";
import { useDailyFigures } from "../data/useDailyFigures";
import type { WeightEntry } from "../lib/types";
import styles from "./DataScreen.module.css";

/** What the open dialog is doing, and to which entry. */
type PendingAction = {
  /** Which dialog is open. */
  kind: "edit" | "delete";
  /** The saved entry the dialog edits or deletes. */
  entry: WeightEntry;
};

/**
 * Every day's figures, newest first: a table on wide screens and rows that
 * expand on phones, with the dialogs that edit and delete saved entries.
 */
export function DataScreen() {
  const figures = useDailyFigures();
  // Kept here rather than in each row, so there's only ever one dialog,
  // whichever layout opened it. `null` means no dialog is open.
  const [pending, setPending] = useState<PendingAction | null>(null);
  // Worked out during render rather than kept in state, so it always matches
  // the figures. Reversing a few hundred days is quick enough to redo.
  const newestFirst = figures.toReversed();

  const actions = {
    onEdit: (entry: WeightEntry) => setPending({ kind: "edit", entry }),
    onDelete: (entry: WeightEntry) => setPending({ kind: "delete", entry }),
  };
  const closeDialog = () => setPending(null);

  return (
    <>
      <h1>Data</h1>
      {newestFirst.length === 0 ? (
        <p>No entries yet. Log your first weight on Home.</p>
      ) : (
        <>
          <div className={styles.narrow}>
            <Card>
              <FiguresList days={newestFirst} {...actions} />
            </Card>
          </div>
          <div className={styles.wide}>
            <Card>
              <FiguresTable days={newestFirst} {...actions} />
            </Card>
          </div>
        </>
      )}

      {pending?.kind === "edit" && (
        <EditEntryDialog entry={pending.entry} onClose={closeDialog} />
      )}
      {pending?.kind === "delete" && (
        <DeleteEntryDialog entry={pending.entry} onClose={closeDialog} />
      )}
    </>
  );
}
