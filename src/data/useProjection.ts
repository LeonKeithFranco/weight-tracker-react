import { useMemo } from "react";
import { buildDailySeries } from "../lib/dailySeries";
import { projectRange, type ProjectedDay } from "../lib/projectedRange";
import type { DailyPoint } from "../lib/types";
import { useData } from "./dataContext";

/**
 * The daily series and its projected range, or `null` for the projection
 * when there aren't enough days. Recalculated only when the entries change,
 * not the target or unit, because the projection uses neither.
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
