/** Returns a number from 0 up to but not including 1, like `Math.random`. */
export type RandomSource = () => number;

/**
 * Hashes text to a 32-bit whole number with FNV-1a, so the same text always
 * gives the same seed. `Math.imul` multiplies as 32-bit integers, which plain
 * `*` can't do because every JavaScript number is a 64-bit float.
 */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  // `>>> 0` reads the bits as unsigned, because `^` and `imul` can go negative.
  return hash >>> 0;
}

/**
 * Creates a seeded generator using Mulberry32, a small and fast algorithm that
 * is good enough for simulations but not for security. `Math.random` can't be
 * seeded, so it can't repeat a result.
 */
export function createRandom(seed: number): RandomSource {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 2 ** 32;
  };
}

/**
 * Draws from a normal distribution with the Box-Muller transform, which turns
 * two uniform numbers into one normally distributed number.
 */
export function nextNormal(
  random: RandomSource,
  mean: number,
  standardDeviation: number,
): number {
  // `1 - random()` can't be 0, and the logarithm of 0 is undefined.
  const radius = Math.sqrt(-2 * Math.log(1 - random()));
  const angle = 2 * Math.PI * random();
  return mean + standardDeviation * radius * Math.cos(angle);
}
