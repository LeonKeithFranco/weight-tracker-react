import type { ReactNode } from "react";
import styles from "./Card.module.css";

/**
 * Draws a panel around one section of a screen. It only adds the look, so
 * the section inside keeps its own heading and landmark.
 */
export function Card({ children }: { children: ReactNode }) {
  return <div className={styles.card}>{children}</div>;
}
