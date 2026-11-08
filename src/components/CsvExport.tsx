import { useId, useState } from "react";
import { useData } from "../data/dataContext";
import { describeError } from "../errors/describeError";
import { downloadFile } from "../files/downloadFile";
import { formatCsv } from "../lib/csvExport";
import { localToday } from "../lib/dates";
import styles from "./forms.module.css";

type ExportState =
  | { status: "idle" }
  | { status: "exported"; count: number }
  | { status: "failed" };

/** Downloads every real entry as a CSV file, in kg at full precision. */
export function CsvExport() {
  const { entries, logError } = useData();
  const id = useId();
  const [exportState, setExportState] = useState<ExportState>({
    status: "idle",
  });

  function handleExport() {
    try {
      downloadFile(
        formatCsv(entries),
        `weight-tracker-${localToday()}.csv`,
        "text/csv",
      );
      setExportState({ status: "exported", count: entries.length });
    } catch (error) {
      // Caught here to show the failure on screen, so the global handler
      // never sees it and this records it instead.
      void logError("Couldn't export the CSV", {
        error: describeError(error),
      });
      setExportState({ status: "failed" });
    }
  }

  const hintId = `${id}-hint`;
  const nothingToExport = entries.length === 0;

  return (
    <section className={styles.form} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Export</h2>

      <p id={hintId} className={styles.hint}>
        {nothingToExport
          ? "Nothing to export yet."
          : "Downloads every weigh-in as a CSV file, in kg. Estimated days aren't included."}
      </p>

      <button
        type="button"
        onClick={handleExport}
        disabled={nothingToExport}
        aria-describedby={hintId}
      >
        Export CSV
      </button>

      <p role="status" className={styles.status}>
        {exportState.status === "exported" &&
          `Exported ${exportState.count} ${exportState.count === 1 ? "entry" : "entries"}.`}
        {exportState.status === "failed" &&
          "Couldn't export your data. Try again."}
      </p>
    </section>
  );
}
