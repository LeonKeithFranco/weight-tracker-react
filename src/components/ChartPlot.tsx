import type { ComponentProps, ReactNode } from "react";
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
import { ChartTooltip, type RowSeries, type TooltipRow } from "./ChartTooltip";
import styles from "./chart.module.css";

/**
 * Every chart's y-axis is this wide, in pixels, whatever its labels are, so
 * the plots all start at the same point and dates line up down the page.
 * Wide enough for the longest labels, such as "-0.45%", whose minus sign was
 * cut off at 48.
 */
const Y_AXIS_WIDTH = 56;

/** What every chart's card passes to its plot. */
export type PlotProps<Row extends TooltipRow> = {
  rows: Row[];
  series: RowSeries<Row>[];
  hidden: ReadonlySet<string>;
  /** Added after each tooltip value, such as " lb" or "%". */
  suffix: string;
  dateFormat: string;
};

/** Generic over the row type, so the Projection chart's rows work too. */
type Props<Row extends TooltipRow> = PlotProps<Row> & {
  /** Which Recharts chart to draw, such as `LineChart`. */
  chart:
    | typeof LineChart
    | typeof AreaChart
    | typeof BarChart
    | typeof ComposedChart;
  /** Borrowed from `YAxis` itself, so it accepts whatever Recharts does. */
  yDomain?: ComponentProps<typeof YAxis>["domain"];
  /** Formats y-axis labels, such as adding "%". Plain numbers by default. */
  yTickFormatter?: (value: number) => string;
  /** The chart's own lines, areas or bars, and any reference lines. */
  children: ReactNode;
};

/**
 * What every chart's plot has in common: the grid, date axis, y-axis and
 * tooltip. It's the part that uses Recharts, so it loads in a file of its
 * own, while `ChartCard` around it shows at once. Each plot passes in only
 * what makes it different.
 */
export function ChartPlot<Row extends TooltipRow>({
  chart: Chart,
  rows,
  series,
  hidden,
  suffix,
  dateFormat,
  yDomain,
  yTickFormatter,
  children,
}: Props<Row>) {
  // A line chart marks the day under the pointer with a thin vertical line.
  // A bar chart shades the whole bar's slot instead, which suits bars better.
  const cursor =
    Chart === BarChart
      ? { fill: "var(--chart-grid)" }
      : { stroke: "var(--chart-axis)" };

  return (
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
  );
}
