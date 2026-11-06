export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Divides by n - 1 because the values are a sample of how weight changes, not
 * every change there will ever be. Matches `STDEV.S` in a spreadsheet.
 */
export function sampleStandardDeviation(values: number[]): number {
  const average = mean(values);
  const squaredDistances = values.map((value) => (value - average) ** 2);
  const sum = squaredDistances.reduce((total, value) => total + value, 0);
  return Math.sqrt(sum / (values.length - 1));
}

/**
 * Slope of the least-squares line through evenly spaced values, so the result
 * is the change per step. Each value's position is its index.
 */
export function linearSlope(values: number[]): number {
  const averageValue = mean(values);
  const averageIndex = (values.length - 1) / 2;
  let covariance = 0;
  let variance = 0;

  values.forEach((value, index) => {
    const distance = index - averageIndex;
    covariance += distance * (value - averageValue);
    variance += distance ** 2;
  });

  return covariance / variance;
}

/**
 * Reads a percentile from values already sorted in ascending order, blending
 * the two nearest values. `fraction` runs from 0 to 1, so 0.5 is the median.
 * Matches `PERCENTILE.INC` in a spreadsheet and NumPy's default.
 */
export function percentile(
  sortedValues: ArrayLike<number>,
  fraction: number,
): number {
  const position = (sortedValues.length - 1) * fraction;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lower = sortedValues[lowerIndex];
  const upper = sortedValues[upperIndex];
  return lower + (upper - lower) * (position - lowerIndex);
}
