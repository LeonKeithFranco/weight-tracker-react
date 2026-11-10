import { lazy } from "react";

/**
 * Loads every plot's file, which holds Recharts.
 *
 * @remarks
 * The plots load in their own file the first time a chart is shown, because
 * Recharts is about half of the app's JavaScript and no other screen uses it.
 * Every plot shares this one import, so the browser fetches the file once,
 * and the first plot to ask starts the download for all of them. Their cards
 * don't wait for it. `lazy` expects a default export, so each named one is
 * renamed.
 *
 * @returns The plots' module, once its file has loaded.
 * @throws The browser's error, when the plots' file can't be fetched.
 */
const loadPlots = () => import("./chartPlots");

/** `LossRatePlot`, loaded with the other plots the first time one is drawn. */
export const LossRatePlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.LossRatePlot })),
);
/** `ProgressPlot`, loaded with the other plots the first time one is drawn. */
export const ProgressPlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.ProgressPlot })),
);
/**
 * `ProjectionPlot`, loaded with the other plots the first time one is drawn.
 */
export const ProjectionPlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.ProjectionPlot })),
);
/**
 * `WeeklyChangePlot`, loaded with the other plots the first time one is drawn.
 */
export const WeeklyChangePlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.WeeklyChangePlot })),
);
/**
 * `WeightTrendsPlot`, loaded with the other plots the first time one is drawn.
 */
export const WeightTrendsPlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.WeightTrendsPlot })),
);
