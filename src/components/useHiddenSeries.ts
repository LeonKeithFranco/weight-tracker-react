import { useState } from "react";

/**
 * Which of a chart's series the legend has hidden. Every series starts shown,
 * and the set lives in the chart that calls this, so each chart keeps its own.
 */
export function useHiddenSeries(): {
  hidden: ReadonlySet<string>;
  toggle: (key: string) => void;
} {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  function toggle(key: string) {
    setHidden((current) => {
      // A new set rather than changing the old one, so React sees a different
      // object and re-renders. Changing it in place would look like no change.
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return { hidden, toggle };
}
