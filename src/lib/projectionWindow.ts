/** Projections need this many days of data before they mean anything. */
export const MIN_PROJECTION_DAYS = 14;

/** A 28-day window changed direction too often. See `docs/SPEC.md`. */
const PROJECTION_WINDOW_DAYS = 90;

/** The recent days a projection uses, or all of them if there are fewer. */
export function projectionWindow<T>(series: T[]): T[] {
  return series.slice(-PROJECTION_WINDOW_DAYS);
}
