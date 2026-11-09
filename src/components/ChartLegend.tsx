import styles from "./ChartLegend.module.css";

/** One line, area or set of bars in a chart, as the legend describes it. */
export type ChartSeries = {
  /** The row field it plots, which is also its React key. */
  key: string;
  name: string;
  color: string;
  dashed: boolean;
  /** How many decimal places tooltips round its values to. */
  decimals: number;
};

type Props = {
  series: ChartSeries[];
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
};

/**
 * A legend where each item is a button that shows or hides its series. The
 * text stays in the page's ink so it's easy to read, and a short sample of the
 * line beside it carries the colour and dash.
 */
export function ChartLegend({ series, hidden, onToggle }: Props) {
  return (
    <ul className={styles.legend}>
      {series.map(({ key, name, color, dashed }) => (
        <li key={key}>
          <button
            type="button"
            className={styles.item}
            // Pressed means shown, so a screen reader hears "Weight, toggle
            // button, pressed" for a line that's on the chart.
            aria-pressed={!hidden.has(key)}
            onClick={() => onToggle(key)}
          >
            {/* Decoration only, since the name says which series it is. */}
            <svg className={styles.sample} viewBox="0 0 24 12" aria-hidden>
              <line
                x1="0"
                y1="6"
                x2="24"
                y2="6"
                stroke={color}
                strokeWidth="3"
                strokeDasharray={dashed ? "6 4" : undefined}
              />
            </svg>
            {name}
          </button>
        </li>
      ))}
    </ul>
  );
}
