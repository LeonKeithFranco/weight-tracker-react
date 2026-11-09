import { Line, LineChart, ReferenceLine } from "recharts";
import type { ChartRow } from "../lib/chartRows";
import { FIGURE_LABELS } from "../lib/figureLabels";
import type { WeightUnit } from "../lib/types";
import { AVERAGE_DECIMALS } from "../lib/units";
import { ChartFrame } from "./ChartFrame";
import type { ChartRowSeries } from "./ChartTooltip";

const SERIES: ChartRowSeries[] = [
  {
    key: "weightLossPerWeek",
    name: FIGURE_LABELS.weightLossPerWeekKg,
    color: "var(--series-1)",
    dashed: false,
    decimals: AVERAGE_DECIMALS,
  },
];

/** Nothing is ever hidden, because hiding the only line would empty the chart. */
const NONE_HIDDEN: ReadonlySet<string> = new Set();

type Props = {
  rows: ChartRow[];
  unit: WeightUnit;
  dateFormat: string;
};

/**
 * The average loss per week since the start. One line, so its legend is
 * plain text rather than a button to hide it.
 */
export function LossRateChart({ rows, unit, dateFormat }: Props) {
  return (
    <ChartFrame
      title={`Loss rate (${unit} per week)`}
      chart={LineChart}
      rows={rows}
      series={SERIES}
      hidden={NONE_HIDDEN}
      suffix={` ${unit}`}
      dateFormat={dateFormat}
      // Fits the data, since the rate settles well away from 0 after the
      // first few weeks.
      yDomain={["auto", "auto"]}
    >
      {/* Below 0 means weight gained since the start. Only shows when the axis
          reaches 0. */}
      <ReferenceLine y={0} stroke="var(--chart-axis)" />
      <Line
        dataKey="weightLossPerWeek"
        name={SERIES[0].name}
        stroke={SERIES[0].color}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4 }}
        type="linear"
        isAnimationActive={false}
      />
    </ChartFrame>
  );
}
