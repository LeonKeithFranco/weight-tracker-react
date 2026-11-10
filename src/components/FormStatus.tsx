import styles from "./forms.module.css";

/** The props for {@link FormStatus}. */
type Props = {
  /** Shown in the success colour, such as "Target saved." */
  success: string | null;
  /** Shown when the action failed, such as "Couldn't save. Try again." */
  failure: string | null;
};

/**
 * The line under a form or button that says how the last action went.
 * It's always in the page, even when empty, because screen readers only
 * announce changes to a status that's already there.
 *
 * @remarks
 * Give it at most one message. With both `null`, the line is empty.
 */
export function FormStatus({ success, failure }: Props) {
  return (
    <p
      role="status"
      className={
        success === null ? styles.status : `${styles.status} ${styles.success}`
      }
    >
      {success ?? failure}
    </p>
  );
}
