import type { ChartRow } from "../lib/chartRows";
import { formatDate } from "../lib/dates";
import { formatNumber } from "../lib/units";
import type { ChartSeries } from "./ChartLegend";
import styles from "./ChartTooltip.module.css";

/** A series that plots one of the chart row's fields. */
export type ChartRowSeries = ChartSeries & { key: keyof ChartRow };

type Props = {
  row: ChartRow;
  series: ChartRowSeries[];
  hidden: ReadonlySet<string>;
  /** Added after each value, such as " lb" or "%". */
  suffix: string;
  dateFormat: string;
};

/**
 * The day under the pointer or finger: its date in the user's own format,
 * whether it was estimated, and each shown series rounded for display.
 */
export function ChartTooltip({
  row,
  series,
  hidden,
  suffix,
  dateFormat,
}: Props) {
  const shown = series.filter(({ key }) => !hidden.has(key));

  return (
    <div className={styles.tooltip}>
      <p className={styles.date}>
        {formatDate(row.date, dateFormat)}
        {row.isEstimated && <span className={styles.estimated}>Estimated</span>}
      </p>
      <dl className={styles.values}>
        {shown.map(({ key, name, color, decimals }) => {
          const value = row[key];
          // Values that can be empty, such as weight to lose without a
          // target, are left out. Number checks also rule out the date.
          if (typeof value !== "number") {
            return null;
          }
          return (
            <div key={key} className={styles.value}>
              <dt>
                <span className={styles.swatch} style={{ background: color }} />
                {name}
              </dt>
              <dd>
                {formatNumber(value, decimals)}
                {suffix}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
