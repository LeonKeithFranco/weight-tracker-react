import { describe, expect, it } from "vitest";
import { createRandom, hashString, nextNormal } from "./random";
import { mean, sampleStandardDeviation } from "./statistics";

const SAMPLE_SIZE = 100_000;

describe("hashString", () => {
  it("matches published FNV-1a values", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
    expect(hashString("foobar")).toBe(0xbf9cf968);
  });
});

describe("createRandom", () => {
  it("repeats the same numbers from the same seed", () => {
    const first = createRandom(42);
    const second = createRandom(42);

    for (let draw = 0; draw < 100; draw++) {
      expect(first()).toBe(second());
    }
  });

  it("gives different numbers from different seeds", () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it("keeps producing the same known sequence", () => {
    // Changing the algorithm would change every user's Projection chart.
    const random = createRandom(1);

    expect([random(), random(), random()]).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
  });

  it("stays from 0 up to but not including 1, with an even spread", () => {
    const random = createRandom(7);
    const samples = Array.from({ length: SAMPLE_SIZE }, () => random());

    expect(Math.min(...samples.slice(0, 10_000))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...samples.slice(0, 10_000))).toBeLessThan(1);
    expect(mean(samples)).toBeCloseTo(0.5, 2);
  });
});

describe("nextNormal", () => {
  it("draws with the requested mean and standard deviation", () => {
    const random = createRandom(7);
    const samples = Array.from({ length: SAMPLE_SIZE }, () =>
      nextNormal(random, -0.2, 0.8),
    );

    expect(mean(samples)).toBeCloseTo(-0.2, 1);
    expect(sampleStandardDeviation(samples)).toBeCloseTo(0.8, 1);
  });

  it("puts about 68% of draws within one standard deviation", () => {
    const random = createRandom(7);
    const samples = Array.from({ length: SAMPLE_SIZE }, () =>
      nextNormal(random, 0, 1),
    );
    const within = samples.filter((sample) => Math.abs(sample) < 1);

    expect(within.length / SAMPLE_SIZE).toBeCloseTo(0.6827, 2);
  });

  it("always returns the mean when the standard deviation is 0", () => {
    expect(nextNormal(createRandom(7), 80, 0)).toBe(80);
  });
});
