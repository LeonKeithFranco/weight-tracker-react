import { useState } from "react";
import { LossRateChart } from "../components/LossRateChart";
import { ProgressChart } from "../components/ProgressChart";
import { RangePresets } from "../components/RangePresets";
import { WeeklyChangeChart } from "../components/WeeklyChangeChart";
import { WeightTrendsChart } from "../components/WeightTrendsChart";
import { useData } from "../data/dataContext";
import { useDailyFigures } from "../data/useDailyFigures";
import { DEFAULT_RANGE_PRESET, filterByRange } from "../lib/chartRange";
import { toChartRows } from "../lib/chartRows";

export function ChartsScreen() {
  const figures = useDailyFigures();
  const { displayUnit: unit, dateFormat, targetWeightKg } = useData().settings;
  // One preset for every chart, so they always cover the same days.
  const [preset, setPreset] = useState(DEFAULT_RANGE_PRESET);
  // The figures come from the full history, so running lows and averages are
  // right before the range cuts them down to what's shown.
  const rows = filterByRange(toChartRows(figures, unit), preset);
  // What every chart needs, passed with one spread.
  const chartProps = { rows, unit, dateFormat };

  return (
    <>
      <h1>Charts</h1>
      {rows.length === 0 ? (
        <p>No entries yet. Log your first weight on Home.</p>
      ) : (
        <>
          <RangePresets value={preset} onChange={setPreset} />
          <WeightTrendsChart {...chartProps} />
          <ProgressChart {...chartProps} hasTarget={targetWeightKg !== null} />
          <LossRateChart {...chartProps} />
          {/* A percentage has no unit, so only the rows and date format. */}
          <WeeklyChangeChart rows={rows} dateFormat={dateFormat} />
        </>
      )}
    </>
  );
}
