import { useId } from "react";
import styles from "./forms.module.css";

/** Where the code, the README and each release's notes live. */
const REPO_URL = "https://github.com/leonkeithfranco/weight-tracker-react";

/** Shows which version of the app is running, and where to find out more. */
export function AboutApp() {
  const id = useId();

  return (
    <section className={styles.form} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>About</h2>
      <p className={styles.hint}>Version {__APP_VERSION__}</p>
      <a href={REPO_URL}>Help and source code on GitHub</a>
    </section>
  );
}
