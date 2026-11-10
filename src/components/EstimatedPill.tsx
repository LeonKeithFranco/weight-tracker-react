import styles from "./EstimatedPill.module.css";

/** The props for {@link EstimatedPill}. */
type Props = {
  /**
   * A class for where it sits, which each layout decides, such as beside the
   * date or under it.
   */
  className?: string;
};

/**
 * Marks a day the app estimated from the days either side, in the table and
 * the phone rows alike.
 */
export function EstimatedPill({ className }: Props) {
  return (
    <span className={className ? `${styles.pill} ${className}` : styles.pill}>
      Estimated
    </span>
  );
}
