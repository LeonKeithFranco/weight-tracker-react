import NumberFlow from "@number-flow/react";
import { useEffect, useRef, useState } from "react";
import { splitDateParts } from "../lib/dates";
import styles from "./RollingDate.module.css";

type RollingDateProps = {
  /** The date as shown, or a status such as "No estimate". */
  text: string;
  /**
   * Sorts the way the date does, such as its `YYYY-MM-DD` form, so the parts
   * roll forward when the date gets later. `null` for a status.
   */
  order: string | null;
};

/** 1 rolls the parts up, like a later date, and -1 rolls them down. */
type Trend = 1 | -1;

/**
 * Shows a date that rolls to its new value when it changes: each run of
 * digits rolls to its new digits, and any other text, such as a month name,
 * slides in. All the parts move the same way, so a later date rolls up even
 * where the day number gets smaller. Nothing moves on the first render, or
 * when the device asks for reduced motion.
 *
 * It's hidden from screen readers, so put the date as plain text beside it.
 */
export function RollingDate({ text, order }: RollingDateProps) {
  // Compares with the last render's date to find the direction. Setting state
  // during render, when a prop changes, is React's pattern for this, and
  // React renders again straight away, before showing anything.
  const [previous, setPrevious] = useState({ text, order });
  const [motion, setMotion] = useState<{ changed: boolean; trend: Trend }>({
    changed: false,
    trend: 1,
  });
  if (text !== previous.text) {
    setPrevious({ text, order });
    setMotion({
      changed: true,
      trend:
        previous.order !== null && order !== null && order < previous.order
          ? -1
          : 1,
    });
  }

  return (
    <span aria-hidden="true">
      {splitDateParts(text).map((part, index) =>
        part.kind === "digits" ? (
          <NumberFlow
            key={`${index}-digits`}
            value={Number(part.text)}
            locales="en-US"
            format={{
              minimumIntegerDigits: part.text.length,
              useGrouping: false,
            }}
            trend={motion.trend}
          />
        ) : (
          // Keyed by its text, so a new month name is a new span, which
          // slides in as it mounts.
          <SlidingText
            key={`${index}-${part.text}`}
            text={part.text}
            slideFrom={motion.changed ? motion.trend : null}
          />
        ),
      )}
    </span>
  );
}

type SlidingTextProps = {
  text: string;
  /** Which way to slide in when it mounts, or `null` to just appear. */
  slideFrom: Trend | null;
};

function SlidingText({ text, slideFrom }: SlidingTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Keeps the direction it mounted with, so only new text slides, not text
  // that was already showing.
  const [direction] = useState(slideFrom);

  useEffect(() => {
    // jsdom has no `matchMedia` or `animate`, hence the `?.`s.
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (direction === null || reducedMotion) {
      return;
    }
    // Comes in from below when rolling up, as NumberFlow's digits do.
    const animation = ref.current?.animate?.(
      [
        { transform: `translateY(${direction * 0.5}em)`, opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 450, easing: "ease-out" },
    );
    // Stops the slide if the text goes before it finishes.
    return () => animation?.cancel();
  }, [direction]);

  return (
    <span ref={ref} className={styles.text}>
      {text}
    </span>
  );
}
