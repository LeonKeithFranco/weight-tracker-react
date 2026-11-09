import { useState } from "react";
import { EditEntryDialog } from "../components/EditEntryDialog";
import { FiguresList } from "../components/FiguresList";
import { FiguresTable } from "../components/FiguresTable";
import { useDailyFigures } from "../data/useDailyFigures";
import type { WeightEntry } from "../lib/types";
import styles from "./DataScreen.module.css";

export function DataScreen() {
  const figures = useDailyFigures();
  // The entry being edited, if any. Kept here rather than in each row, so
  // there's only ever one dialog, whichever layout opened it.
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  // Worked out during render rather than kept in state, so it always matches
  // the figures. Reversing a few hundred days is quick enough to redo.
  const newestFirst = figures.toReversed();

  return (
    <>
      <h1>Data</h1>
      {newestFirst.length === 0 ? (
        <p>No entries yet. Log your first weight on Home.</p>
      ) : (
        <>
          <div className={styles.narrow}>
            <FiguresList days={newestFirst} onEdit={setEditing} />
          </div>
          <div className={styles.wide}>
            <FiguresTable days={newestFirst} onEdit={setEditing} />
          </div>
        </>
      )}

      {editing && (
        <EditEntryDialog entry={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
