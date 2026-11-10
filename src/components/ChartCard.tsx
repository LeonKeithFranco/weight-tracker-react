import { Suspense, useId, type ReactNode } from "react";
import { ChartLegend, type LegendItem } from "./ChartLegend";
import styles from "./chart.module.css";

type Props = {
  /** The chart's heading, which also names its section. */
  title: string;
  /** What the legend lists. */
  legendItems: LegendItem[];
  /** The keys of the series the legend has hidden. */
  hidden: ReadonlySet<string>;
  /**
   * Called with a series' key when its legend item is pressed. Giving it makes
   * the legend's items toggle buttons. Left out for a single series, whose
   * legend is plain text, because hiding it would empty the chart.
   */
  onToggle?: (key: string) => void;
  /** The chart's plot. */
  children: ReactNode;
  /** Shown under the legend, such as a note on what faded lines mean. */
  footer?: ReactNode;
};

/**
 * Everything in a chart's card except the plot: the heading, legend and
 * notes. None of it uses Recharts, so it shows as soon as the screen opens.
 * While the plot's file loads, an empty box the plot's size holds its place,
 * so nothing moves when it arrives.
 */
export function ChartCard({
  title,
  legendItems,
  hidden,
  onToggle,
  children,
  footer,
}: Props) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <div className={styles.body}>
        <Suspense fallback={<div className={styles.chart} />}>
          {children}
        </Suspense>
        <ChartLegend items={legendItems} hidden={hidden} onToggle={onToggle} />
      </div>
      {footer}
    </section>
  );
}
