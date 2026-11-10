import type { ChartRow } from "../lib/chartRows";
import { formatDate } from "../lib/dates";
import type { CalendarDate } from "../lib/types";
import { formatNumber } from "../lib/units";
import type { ChartSeries } from "./ChartLegend";
import styles from "./ChartTooltip.module.css";

/** What every chart's rows have, whatever else they hold. */
export type TooltipRow = {
  /** The day the row plots. */
  date: CalendarDate;
  /** Whether the day's weight was estimated, which the tooltip says. */
  isEstimated: boolean;
};

/**
 * A series that plots one of a row type's fields. `& string` drops any
 * number or symbol keys, because a series key is also a React key and a
 * legend id.
 */
export type RowSeries<Row> = ChartSeries & { key: keyof Row & string };

/** A series of the four spreadsheet charts, which share `ChartRow`. */
export type ChartRowSeries = RowSeries<ChartRow>;

/**
 * Writes a value as the tooltip shows it.
 *
 * @param value - A row's value for one series, of any type.
 * @param decimals - How many decimal places to round to.
 * @returns A number rounded, a `[low, high]` range as "low – high", and
 * anything else, such as an empty value, as `null`.
 */
function formatValue(value: unknown, decimals: number): string | null {
  if (typeof value === "number") {
    return formatNumber(value, decimals);
  }
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((part) => typeof part === "number")
  ) {
    return `${formatNumber(value[0], decimals)} – ${formatNumber(value[1], decimals)}`;
  }
  return null;
}

/** The props for {@link ChartTooltip}. */
type Props<Row extends TooltipRow> = {
  /** The day under the pointer. */
  row: Row;
  /** Every series the chart can show, in the order to list them. */
  series: RowSeries<Row>[];
  /** The keys of the series the legend has hidden, which aren't listed. */
  hidden: ReadonlySet<string>;
  /** Added after each value, such as " lb" or "%". */
  suffix: string;
  /** The date format setting. */
  dateFormat: string;
};

/**
 * The day under the pointer or finger: its date in the user's own format,
 * whether it was estimated, and each shown series rounded for display.
 * Generic over the row type, so any chart's rows work.
 */
export function ChartTooltip<Row extends TooltipRow>({
  row,
  series,
  hidden,
  suffix,
  dateFormat,
}: Props<Row>) {
  const shown = series.filter(({ key }) => !hidden.has(key));

  return (
    <div className={styles.tooltip}>
      <p className={styles.date}>
        {formatDate(row.date, dateFormat)}
        {row.isEstimated && <span className={styles.estimated}>Estimated</span>}
      </p>
      <dl className={styles.values}>
        {shown.map(({ key, name, color, decimals }) => {
          // Values that can be empty, such as weight to lose without a
          // target, are left out.
          const text = formatValue(row[key], decimals);
          if (text === null) {
            return null;
          }
          return (
            <div key={key} className={styles.value}>
              <dt>
                <span className={styles.swatch} style={{ background: color }} />
                {name}
              </dt>
              <dd>
                {text}
                {suffix}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
