import styles from "./ChartLegend.module.css";

/** What a legend needs to describe one item. */
export type LegendItem = {
  /** A unique name for the item, which is also its React key. */
  key: string;
  name: string;
  color: string;
  dashed: boolean;
  /** A short line by default. A square suits bars, which are filled. */
  marker?: "line" | "square";
};

/** One line, area or set of bars in a chart, as the legend describes it. */
export type ChartSeries = LegendItem & {
  /** How many decimal places tooltips round its values to. */
  decimals: number;
};

type Props = {
  items: LegendItem[];
  hidden: ReadonlySet<string>;
  /** Makes each item a button that shows or hides its series. Without it,
   * the items are plain text, for charts with nothing to hide. */
  onToggle?: (key: string) => void;
};

/**
 * A chart's legend. The text stays in the page's ink so it's easy to read,
 * and a small sample beside it carries the colour and dash.
 */
export function ChartLegend({ items, hidden, onToggle }: Props) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.key}>
          {onToggle ? (
            <button
              type="button"
              className={styles.item}
              // Pressed means shown, so a screen reader hears "Weight, toggle
              // button, pressed" for a line that's on the chart.
              aria-pressed={!hidden.has(item.key)}
              onClick={() => onToggle(item.key)}
            >
              <Sample item={item} />
              {item.name}
            </button>
          ) : (
            <span className={styles.item}>
              <Sample item={item} />
              {item.name}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Decoration only, since the name says which series it is. */
function Sample({ item }: { item: LegendItem }) {
  return (
    <svg className={styles.sample} viewBox="0 0 24 12" aria-hidden>
      {item.marker === "square" ? (
        <rect x="6" y="0" width="12" height="12" fill={item.color} />
      ) : (
        <line
          x1="0"
          y1="6"
          x2="24"
          y2="6"
          stroke={item.color}
          strokeWidth="3"
          strokeDasharray={item.dashed ? "6 4" : undefined}
        />
      )}
    </svg>
  );
}
