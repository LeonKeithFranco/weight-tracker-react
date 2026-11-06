import { test } from "vitest";
import { simulateProjection } from "./simulation";
import { seriesOf } from "./testSeries";

const weights = Array.from(
  { length: 400 },
  (_, index) => 100 - index * 0.05 + Math.sin(index) * 0.7,
);
const series = seriesOf(weights);

test("simulateProjection", async ({ bench }) => {
  await bench("400 days of history", () => {
    simulateProjection(series);
  }).run();
});
