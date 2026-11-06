import { describe, expect, it } from "vitest";
import {
  linearSlope,
  mean,
  percentile,
  sampleStandardDeviation,
} from "./statistics";

describe("mean", () => {
  it("averages the values", () => {
    expect(mean([1, 2, 6])).toBe(3);
  });
});

describe("sampleStandardDeviation", () => {
  it("divides by one less than the number of values", () => {
    // Mean 5, squared distances sum to 32, and 32 / 7 is the sample variance.
    expect(sampleStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(
      Math.sqrt(32 / 7),
      10,
    );
  });

  it("is 0 when every value is the same", () => {
    expect(sampleStandardDeviation([3, 3, 3])).toBe(0);
  });
});

describe("linearSlope", () => {
  it("returns the change per step of a straight line", () => {
    expect(linearSlope([10, 8, 6, 4])).toBeCloseTo(-2, 10);
  });

  it("finds the best fit through values that aren't on a line", () => {
    // Worked by hand: covariance 4 over variance 5.
    expect(linearSlope([0, 2, 1, 3])).toBeCloseTo(0.8, 10);
  });

  it("is 0 for a symmetrical rise and fall", () => {
    expect(linearSlope([1, 2, 3, 2, 1])).toBeCloseTo(0, 10);
  });
});

describe("percentile", () => {
  const VALUES = [10, 20, 30, 40, 50];

  it("returns the ends at 0 and 1", () => {
    expect(percentile(VALUES, 0)).toBe(10);
    expect(percentile(VALUES, 1)).toBe(50);
  });

  it("returns the middle value as the median of an odd count", () => {
    expect(percentile(VALUES, 0.5)).toBe(30);
  });

  it("blends the two nearest values between positions", () => {
    expect(percentile(VALUES, 0.1)).toBeCloseTo(14, 10);
    expect(percentile([10, 20], 0.5)).toBe(15);
  });

  it("accepts typed arrays", () => {
    expect(percentile(new Float64Array(VALUES), 0.5)).toBe(30);
  });
});
