import { useEffect, useId, useState } from "react";
import { Link } from "react-router";
import { FormStatus } from "../components/FormStatus";
import formStyles from "../components/forms.module.css";
import { useData } from "../data/dataContext";
import { describeError } from "../errors/describeError";
import { downloadFile } from "../files/downloadFile";
import { formatTimestamp, localToday } from "../lib/dates";
import type { LogEntry } from "../lib/types";
import styles from "./LogScreen.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; entries: LogEntry[] }
  | { status: "failed" };

type ExportState = "idle" | "exported" | "failed";

/** The activity log, newest first, within Settings. */
export function LogScreen() {
  const { settings, getLogEntries, logError } = useData();
  const id = useId();
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
  });
  const [exportState, setExportState] = useState<ExportState>("idle");

  useEffect(() => {
    let ignore = false;

    getLogEntries().then(
      (entries) => {
        if (ignore) return;
        setLoadState({ status: "loaded", entries });
      },
      (error: unknown) => {
        if (ignore) return;
        setLoadState({ status: "failed" });
        void logError("Couldn't load the activity log", {
          error: describeError(error),
        });
      },
    );

    return () => {
      ignore = true;
    };
  }, [getLogEntries, logError]);

  function handleExport(entries: LogEntry[]) {
    try {
      downloadFile(
        // Indented, so the file is readable in a text editor.
        JSON.stringify(entries, null, 2),
        `weight-tracker-log-${localToday()}.json`,
        "application/json",
      );
      setExportState("exported");
    } catch (error) {
      void logError("Couldn't export the activity log", {
        error: describeError(error),
      });
      setExportState("failed");
    }
  }

  return (
    <>
      <p className={styles.back}>
        <Link to="/settings">Back to Settings</Link>
      </p>
      <h1>Activity log</h1>

      {loadState.status === "failed" && (
        <p role="alert">
          Couldn&apos;t load the activity log. Try reloading the page.
        </p>
      )}

      {loadState.status === "loaded" && (
        <>
          <div className={formStyles.form}>
            <p id={`${id}-hint`} className={formStyles.hint}>
              {loadState.entries.length === 0
                ? "Nothing recorded yet."
                : "Changes to your data and errors, newest first. Only the newest 5,000 are kept."}
            </p>
            <button
              type="button"
              onClick={() => handleExport(loadState.entries)}
              disabled={loadState.entries.length === 0}
              aria-describedby={`${id}-hint`}
            >
              Export JSON
            </button>
            <FormStatus
              success={
                exportState === "exported" ? "Exported the activity log." : null
              }
              failure={
                exportState === "failed"
                  ? "Couldn't export the activity log. Try again."
                  : null
              }
            />
          </div>

          <ol className={styles.entries} aria-label="Log entries">
            {loadState.entries.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <p className={styles.meta}>
                  {/* Gives the exact moment in a form software can read. */}
                  <time dateTime={entry.timestamp}>
                    {formatTimestamp(entry.timestamp, settings.dateFormat)}
                  </time>
                  <span
                    className={
                      entry.type === "error" ? styles.errorType : undefined
                    }
                  >
                    {entry.type === "error" ? "Error" : "Change"}
                  </span>
                </p>
                <p className={styles.message}>{entry.message}</p>
                {entry.details !== undefined && (
                  // A built-in show and hide, with no state or script needed.
                  <details>
                    <summary>Details</summary>
                    <pre className={styles.details}>
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}
