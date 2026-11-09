import { FiguresTable } from "../components/FiguresTable";
import { useDailyFigures } from "../data/useDailyFigures";

export function DataScreen() {
  const figures = useDailyFigures();
  // Worked out during render rather than kept in state, so it always matches
  // the figures. Reversing a few hundred days is quick enough to redo.
  const newestFirst = figures.toReversed();

  return (
    <>
      <h1>Data</h1>
      {newestFirst.length === 0 ? (
        <p>No entries yet. Log your first weight on Home.</p>
      ) : (
        <FiguresTable days={newestFirst} />
      )}
    </>
  );
}
