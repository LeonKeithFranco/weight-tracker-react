import { useMemo } from "react";
import { buildDailySeries } from "../lib/dailySeries";
import { projectRange, type ProjectedDay } from "../lib/projectedRange";
import type { DailyPoint } from "../lib/types";
import { useData } from "./dataContext";

/**
 * Calculates the daily series and its projected range. Recalculated only when
 * the entries change, not the target or unit, because the projection uses
 * neither.
 *
 * @returns The daily series, oldest first, and the 180 projected days, or
 * `null` for the projection when there are fewer than 14 days.
 */
export function useProjection(): {
  series: DailyPoint[];
  projected: ProjectedDay[] | null;
} {
  const { entries } = useData();

  return useMemo(() => {
    const series = buildDailySeries(entries);
    return { series, projected: projectRange(series) };
  }, [entries]);
}
