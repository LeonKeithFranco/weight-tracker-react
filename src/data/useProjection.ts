import { useMemo } from "react";
import { buildDailySeries } from "../lib/dailySeries";
import { simulateProjection, type SimulatedDay } from "../lib/simulation";
import type { DailyPoint } from "../lib/types";
import { useData } from "./dataContext";

/** The name the simulation's timing is recorded under, for DevTools. */
export const SIMULATION_MEASURE = "weight-tracker:simulation";

/**
 * Runs `work` and records how long it took under `name`, returning its result
 * unchanged. DevTools shows the timing in the Performance panel, and the
 * console can read it with `performance.getEntriesByName(name)`. Kept outside
 * the hook because reading the clock is a side effect: the hook's result stays
 * the same however long the work takes.
 */
function measured<T>(name: string, work: () => T): T {
  const start = performance.now();
  const result = work();
  performance.measure(name, { start });
  return result;
}

/**
 * The daily series and its simulated future, or `null` for the simulation
 * when there aren't enough days. Recalculated only when the entries change,
 * not the target or unit, because the simulation uses neither.
 */
export function useProjection(): {
  series: DailyPoint[];
  simulated: SimulatedDay[] | null;
} {
  const { entries } = useData();

  return useMemo(() => {
    const series = buildDailySeries(entries);
    const simulated = measured(SIMULATION_MEASURE, () =>
      simulateProjection(series),
    );
    return { series, simulated };
  }, [entries]);
}
