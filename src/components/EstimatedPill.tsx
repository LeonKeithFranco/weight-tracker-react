import styles from "./EstimatedPill.module.css";

/**
 * Marks a day the app estimated from the days either side, in the table and
 * the phone rows alike. `className` is for where it sits, which each layout
 * decides, such as beside the date or under it.
 */
export function EstimatedPill({ className }: { className?: string }) {
  return (
    <span className={className ? `${styles.pill} ${className}` : styles.pill}>
      Estimated
    </span>
  );
}
