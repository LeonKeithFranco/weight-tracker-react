import { WeightTrendsChart } from "../components/WeightTrendsChart";
import { useData } from "../data/dataContext";
import { useDailyFigures } from "../data/useDailyFigures";
import { toChartRows } from "../lib/chartRows";

export function ChartsScreen() {
  const figures = useDailyFigures();
  const unit = useData().settings.displayUnit;
  const rows = toChartRows(figures, unit);

  return (
    <>
      <h1>Charts</h1>
      {rows.length === 0 ? (
        <p>No entries yet. Log your first weight on Home.</p>
      ) : (
        <WeightTrendsChart rows={rows} unit={unit} />
      )}
    </>
  );
}
