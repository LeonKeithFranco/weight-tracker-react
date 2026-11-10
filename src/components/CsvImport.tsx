import { useId, useState, type ChangeEvent } from "react";
import { useData } from "../data/dataContext";
import { describeError } from "../errors/describeError";
import {
  parseCsv,
  type CsvParseResult,
  type InvalidReason,
  type InvalidRow,
  type ParsedCsv,
} from "../lib/csvImport";
import { localToday } from "../lib/dates";
import { previewImport, type ImportPreview } from "../lib/importPreview";
import styles from "./CsvImport.module.css";
import { FormStatus } from "./FormStatus";
import formStyles from "./forms.module.css";

/**
 * Why a whole file is turned away: the parser's reasons, or the browser
 * failing to read the file at all.
 */
type RejectReason =
  Extract<CsvParseResult, { status: "failed" }>["reason"] | "unreadable";

/**
 * Where the import has got to. A file is rejected or previewed. A preview is
 * confirmed, which imports it, or cancelled. A failed import keeps its
 * preview, so it can be tried again.
 */
type ImportState =
  | { status: "idle" }
  | { status: "rejected"; fileName: string; reason: RejectReason }
  | { status: "previewing"; fileName: string; parsed: ParsedCsv }
  | { status: "importing"; fileName: string; parsed: ParsedCsv }
  | { status: "imported"; counts: ImportPreview }
  | { status: "failed"; fileName: string; parsed: ParsedCsv };

/** The message shown for each reason a file is turned away. */
const REJECT_MESSAGES: Record<RejectReason, string> = {
  "unknown-columns":
    "This file needs either date and weight_kg columns, or Date and Weight (lbs) columns.",
  malformed: "This file has a quote that's never closed, so it can't be read.",
  unreadable: "Couldn't read this file. Try choosing it again.",
};

/** The Problem column's text for each reason a row can't be imported. */
const INVALID_REASONS: Record<InvalidReason, string> = {
  "invalid-date": "Not a valid date",
  "future-date": "Date is in the future",
  "invalid-weight": "Not a number above 0",
  "duplicate-date": "Repeats an earlier date",
};

/**
 * Writes a count with the right form of its noun.
 *
 * @param count - How many there are.
 * @param one - The noun for exactly one, such as "entry".
 * @param many - The noun for any other count, such as "entries".
 * @returns The count and noun, such as "1 entry" or "0 entries".
 */
function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Imports a CSV file the user picks. It shows what would change first, and
 * saves nothing until the user confirms.
 */
export function CsvImport() {
  const { entries, importEntries, logError } = useData();
  const id = useId();
  const [importState, setImportState] = useState<ImportState>({
    status: "idle",
  });

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    // `files` is a list, because some file inputs allow picking several.
    const file = input.files?.[0];
    // Empties the input, so picking the same file again still counts as a
    // change, such as after fixing it in a spreadsheet.
    input.value = "";
    if (file === undefined) {
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportState({
        status: "rejected",
        fileName: file.name,
        reason: "unreadable",
      });
      return;
    }

    const result = parseCsv(text, localToday());
    if (result.status === "failed") {
      setImportState({
        status: "rejected",
        fileName: file.name,
        reason: result.reason,
      });
      return;
    }

    setImportState({
      status: "previewing",
      fileName: file.name,
      parsed: { entries: result.entries, invalidRows: result.invalidRows },
    });
  }

  async function handleConfirm(fileName: string, parsed: ParsedCsv) {
    // Counted before saving, because afterwards every row would be an overwrite.
    const counts = previewImport(parsed, entries);
    setImportState({ status: "importing", fileName, parsed });
    try {
      await importEntries(parsed);
      setImportState({ status: "imported", counts });
    } catch (error) {
      void logError("Couldn't import the CSV", {
        error: describeError(error),
      });
      setImportState({ status: "failed", fileName, parsed });
    }
  }

  const hintId = `${id}-hint`;

  return (
    <section className={formStyles.form} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Import</h2>

      <div className={formStyles.field}>
        <label htmlFor={`${id}-file`}>CSV file</label>
        <p id={hintId} className={formStyles.hint}>
          Use the app&apos;s own export, or a spreadsheet with Date and Weight
          (lbs) columns. Nothing is saved until you confirm.
        </p>
        <input
          id={`${id}-file`}
          type="file"
          // Suggests CSV files in the picker. It's only a hint, so the parser
          // still checks whatever is chosen.
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={importState.status === "importing"}
          aria-describedby={hintId}
        />
      </div>

      {importState.status === "rejected" && (
        <p role="alert" className={formStyles.error}>
          {importState.fileName}: {REJECT_MESSAGES[importState.reason]}
        </p>
      )}

      {(importState.status === "previewing" ||
        importState.status === "importing" ||
        importState.status === "failed") && (
        <Preview
          fileName={importState.fileName}
          parsed={importState.parsed}
          preview={previewImport(importState.parsed, entries)}
          importing={importState.status === "importing"}
          onConfirm={() =>
            void handleConfirm(importState.fileName, importState.parsed)
          }
          onCancel={() => setImportState({ status: "idle" })}
        />
      )}

      <FormStatus
        success={
          importState.status === "imported"
            ? `Imported ${plural(
                importState.counts.newCount + importState.counts.overwriteCount,
                "entry",
                "entries",
              )}.`
            : null
        }
        failure={
          importState.status === "failed"
            ? "Couldn't import the file. Nothing was changed. Try again."
            : null
        }
      />
    </section>
  );
}

type PreviewProps = {
  /** The chosen file's name, for the heading. */
  fileName: string;
  /** The file's importable and invalid rows. */
  parsed: ParsedCsv;
  /** How many rows would be new, overwrite an entry or be skipped. */
  preview: ImportPreview;
  /** Whether the import is under way, which disables both buttons. */
  importing: boolean;
  /** Called when the user chooses Import. */
  onConfirm(): void;
  /** Called when the user chooses Cancel. */
  onCancel(): void;
};

/**
 * What the import would change, with buttons to go ahead or cancel. Import is
 * disabled when the file has no rows to import.
 */
function Preview({
  fileName,
  parsed,
  preview,
  importing,
  onConfirm,
  onCancel,
}: PreviewProps) {
  const id = useId();
  const nothingToImport = parsed.entries.length === 0;

  return (
    <section className={styles.preview} aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`}>Preview of {fileName}</h3>

      <dl className={styles.counts}>
        <dt>New entries</dt>
        <dd>{preview.newCount}</dd>
        <dt>Overwrite existing</dt>
        <dd>{preview.overwriteCount}</dd>
        <dt>Invalid, skipped</dt>
        <dd>{preview.invalidCount}</dd>
      </dl>

      {parsed.invalidRows.length > 0 && (
        <InvalidRowsTable rows={parsed.invalidRows} />
      )}

      {nothingToImport && (
        <p className={formStyles.hint}>This file has no rows to import.</p>
      )}

      <div className={styles.buttons}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={importing || nothingToImport}
        >
          Import
        </button>
        <button type="button" onClick={onCancel} disabled={importing}>
          Cancel
        </button>
      </div>
    </section>
  );
}

type InvalidRowsTableProps = {
  /** The rows that can't be imported, in file order. */
  rows: InvalidRow[];
};

/**
 * Lists the rows an import will skip, with each row's line, text and problem,
 * so they can be fixed in the file.
 */
function InvalidRowsTable({ rows }: InvalidRowsTableProps) {
  return (
    // Scrolls on its own, so a file full of bad rows doesn't push the buttons
    // off the screen. `tabIndex` lets keyboard users scroll it too.
    <div className={styles.tableScroll} tabIndex={0}>
      <table className={styles.table}>
        <caption>Rows that will be skipped</caption>
        <thead>
          <tr>
            <th scope="col">Line</th>
            <th scope="col">Date</th>
            <th scope="col">Weight</th>
            <th scope="col">Problem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            // Each line appears once in a file, so it identifies the row.
            <tr key={row.line}>
              <td>{row.line}</td>
              <td>{row.date}</td>
              <td>{row.weight}</td>
              <td>{INVALID_REASONS[row.reason]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
