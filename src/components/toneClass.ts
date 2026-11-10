import type { FigureColumn } from "../lib/figureColumns";
import type { DailyFigures } from "../lib/types";
import styles from "./tone.module.css";

/**
 * Picks the class that colours a loss or gain, such as the 7-day change,
 * shared by the table and the phone rows. Estimated days have none, so they
 * stay grey and don't draw the eye.
 *
 * @param column - The column the value is in.
 * @param day - The day's figures.
 * @returns The loss or gain class, or `undefined` for a column that isn't
 * coloured, a value of 0 or an estimated day.
 */
export function toneClass(
  column: FigureColumn,
  day: DailyFigures,
): string | undefined {
  const tone = day.isEstimated ? null : column.tone?.(day);
  return tone ? styles[tone] : undefined;
}
