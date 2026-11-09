import { FiguresList } from "../components/FiguresList";
import { FiguresTable } from "../components/FiguresTable";
import { useDailyFigures } from "../data/useDailyFigures";
import styles from "./DataScreen.module.css";

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
        <>
          <div className={styles.narrow}>
            <FiguresList days={newestFirst} />
          </div>
          <div className={styles.wide}>
            <FiguresTable days={newestFirst} />
          </div>
        </>
      )}
    </>
  );
}
