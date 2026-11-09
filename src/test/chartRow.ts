import type { ChartRow } from "../lib/chartRows";

/**
 * One logged day's chart row for component tests. Spread it and override what
 * a test cares about, so adding a field to `ChartRow` means changing only this.
 */
export const sampleChartRow: ChartRow = {
  date: "2026-11-05",
  isEstimated: false,
  weight: 200,
  realWeight: 200,
  estimatedWeight: null,
  lowestWeight: 199,
  average7: 201,
  lowestAverage7: 200.5,
  average7ChangePercent: -1,
  average28: 202,
  lowestAverage28: 201.5,
  weightToLose: 20,
  leftToLose: 20,
  pastTarget: null,
  weightLossSinceStart: 10,
  weightLossPerWeek: 1,
};
