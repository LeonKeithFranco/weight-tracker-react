import type { ReactNode } from "react";
import styles from "./Card.module.css";

type Props = {
  /** The section to draw the panel around. */
  children: ReactNode;
};

/**
 * Draws a panel around one section of a screen. It only adds the look, so
 * the section inside keeps its own heading and landmark.
 */
export function Card({ children }: Props) {
  return <div className={styles.card}>{children}</div>;
}
