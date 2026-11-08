import { useMemo } from "react";
import { calculateDailyFigures } from "../lib/dailyFigures";
import { buildDailySeries } from "../lib/dailySeries";
import type { DailyFigures } from "../lib/types";
import { useData } from "./dataContext";

/**
 * Every daily figure, oldest first, calculated from the saved entries. Kept in
 * memory and never saved, so it can't go stale after an edit.
 */
export function useDailyFigures(): DailyFigures[] {
  const { entries, settings } = useData();
  const targetWeightKg = settings.targetWeightKg;

  // Recalculates only when the entries or the target change, not on every
  // render, and not when an unrelated setting such as the date format changes.
  return useMemo(
    () => calculateDailyFigures(buildDailySeries(entries), targetWeightKg),
    [entries, targetWeightKg],
  );
}
