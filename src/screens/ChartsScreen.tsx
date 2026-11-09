import { lazy, Suspense, useState } from "react";
import { RangePresets } from "../components/RangePresets";
import { useData } from "../data/dataContext";
import { useDailyFigures } from "../data/useDailyFigures";
import { DEFAULT_RANGE_PRESET, filterByRange } from "../lib/chartRange";
import { toChartRows } from "../lib/chartRows";
import styles from "./ChartsScreen.module.css";

// The charts load in their own file the first time they're shown, because
// Recharts is most of the app's JavaScript and no other screen uses it. The
// rest of this screen loads with the app, so the heading and presets show at
// once. `lazy` expects a default export, so the named one is renamed.
const ChartCards = lazy(() =>
  import("../components/ChartCards").then((module) => ({
    default: module.ChartCards,
  })),
);

export function ChartsScreen() {
  const figures = useDailyFigures();
  const { displayUnit: unit, dateFormat, targetWeightKg } = useData().settings;
  // One preset for every chart, so they always cover the same days.
  const [preset, setPreset] = useState(DEFAULT_RANGE_PRESET);
  // The figures come from the full history, so running lows and averages are
  // right before the range cuts them down to what's shown.
  const rows = filterByRange(toChartRows(figures, unit), preset);

  return (
    <>
      <h1>Charts</h1>
      {rows.length === 0 ? (
        <p>No entries yet. Log your first weight on Home.</p>
      ) : (
        <div className={styles.layout}>
          {/* Outside the cards, because it changes every chart below it. */}
          <RangePresets value={preset} onChange={setPreset} />
          {/* Nothing shows below the presets for the moment the charts'
              file takes to load, so nothing above them moves. */}
          <Suspense fallback={null}>
            <ChartCards
              rows={rows}
              unit={unit}
              dateFormat={dateFormat}
              targetWeightKg={targetWeightKg}
            />
          </Suspense>
        </div>
      )}
    </>
  );
}
