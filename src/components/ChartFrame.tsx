import { useId, type ComponentProps, type ReactNode } from "react";
import {
  AreaChart,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartLabel } from "../lib/dates";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip, type RowSeries, type TooltipRow } from "./ChartTooltip";
import styles from "./chart.module.css";

/**
 * Every chart's y-axis is this wide, in pixels, whatever its labels are, so
 * the plots all start at the same point and dates line up down the page.
 * Wide enough for the longest labels, such as "-0.45%", whose minus sign was
 * cut off at 48.
 */
const Y_AXIS_WIDTH = 56;

/** Generic over the row type, so the Projection chart's rows work too. */
type Props<Row extends TooltipRow> = {
  title: string;
  /** Which Recharts chart to draw, such as `LineChart`. */
  chart:
    | typeof LineChart
    | typeof AreaChart
    | typeof BarChart
    | typeof ComposedChart;
  rows: Row[];
  series: RowSeries<Row>[];
  hidden: ReadonlySet<string>;
  /** Shows the legend's toggle buttons. Left out for a single series. */
  onToggle?: (key: string) => void;
  /** Added after each tooltip value, such as " lb" or "%". */
  suffix: string;
  dateFormat: string;
  /** Borrowed from `YAxis` itself, so it accepts whatever Recharts does. */
  yDomain?: ComponentProps<typeof YAxis>["domain"];
  /** Formats y-axis labels, such as adding "%". Plain numbers by default. */
  yTickFormatter?: (value: number) => string;
  /** The chart's own lines, areas or bars, and any reference lines. */
  children: ReactNode;
  /** Shown under the legend, such as a note on what faded lines mean. */
  footer?: ReactNode;
};

/**
 * What every chart has in common: the heading, grid, date axis, y-axis,
 * tooltip and legend. Each chart passes in only what makes it different.
 */
export function ChartFrame<Row extends TooltipRow>({
  title,
  chart: Chart,
  rows,
  series,
  hidden,
  onToggle,
  suffix,
  dateFormat,
  yDomain,
  yTickFormatter,
  children,
  footer,
}: Props<Row>) {
  const headingId = useId();
  // A line chart marks the day under the pointer with a thin vertical line.
  // A bar chart shades the whole bar's slot instead, which suits bars better.
  const cursor =
    Chart === BarChart
      ? { fill: "var(--chart-grid)" }
      : { stroke: "var(--chart-axis)" };

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <Chart className={styles.chart} data={rows} responsive>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatChartLabel}
          stroke="var(--chart-axis)"
          minTickGap={24}
        />
        <YAxis
          domain={yDomain}
          tickFormatter={yTickFormatter}
          stroke="var(--chart-axis)"
          width={Y_AXIS_WIDTH}
        />
        <Tooltip
          // Recharts works out which day is under the pointer and passes its
          // data in. Every series shares one row per day, so the first entry's
          // row is the whole day, whichever series are hidden.
          content={({ active, payload }) => {
            const row = payload[0]?.payload as Row | undefined;
            return active && row ? (
              <ChartTooltip
                row={row}
                series={series}
                hidden={hidden}
                suffix={suffix}
                dateFormat={dateFormat}
              />
            ) : null;
          }}
          cursor={cursor}
          isAnimationActive={false}
        />
        {children}
      </Chart>
      {onToggle && (
        <ChartLegend series={series} hidden={hidden} onToggle={onToggle} />
      )}
      {footer}
    </section>
  );
}
