/** Projections need this many days of data before they mean anything. */
export const MIN_PROJECTION_DAYS = 14;

/**
 * How many recent days a projection learns from. A 28-day window changed
 * direction too often. See `docs/SPEC.md`.
 */
const PROJECTION_WINDOW_DAYS = 90;

/**
 * Picks the recent days a projection learns from, shared by the goal date and
 * the Projection chart so they agree.
 *
 * @typeParam T - The kind of day, such as a daily point or a day's figures.
 * @param series - The daily series, oldest first, as points or figures.
 * @returns The last 90 days, or all of them if there are fewer.
 */
export function projectionWindow<T>(series: T[]): T[] {
  return series.slice(-PROJECTION_WINDOW_DAYS);
}
