import { useState } from "react";
import { ChartCards } from "../components/ChartCards";
import { RangePresets } from "../components/RangePresets";
import { useData } from "../data/dataContext";
import { useDailyFigures } from "../data/useDailyFigures";
import { DEFAULT_RANGE_PRESET, filterByRange } from "../lib/chartRange";
import { toChartRows } from "../lib/chartRows";
import styles from "./ChartsScreen.module.css";

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
          {/* The cards show at once, and each plot fills its card when the
              charts' file has loaded. */}
          <ChartCards
            rows={rows}
            unit={unit}
            dateFormat={dateFormat}
            targetWeightKg={targetWeightKg}
          />
        </div>
      )}
    </>
  );
}
