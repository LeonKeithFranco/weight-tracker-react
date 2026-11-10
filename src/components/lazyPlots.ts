import { lazy } from "react";

// The plots load in their own file the first time a chart is shown, because
// Recharts is most of the app's JavaScript and no other screen uses it. Every
// plot shares this one import, so the browser fetches the file once, and the
// first plot to ask starts the download for all of them. Their cards don't
// wait for it. `lazy` expects a default export, so each named one is renamed.
const loadPlots = () => import("./chartPlots");

export const LossRatePlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.LossRatePlot })),
);
export const ProgressPlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.ProgressPlot })),
);
export const ProjectionPlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.ProjectionPlot })),
);
export const WeeklyChangePlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.WeeklyChangePlot })),
);
export const WeightTrendsPlot = lazy(() =>
  loadPlots().then((module) => ({ default: module.WeightTrendsPlot })),
);
