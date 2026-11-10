import { Card } from "../components/Card";
import { LatestFigures } from "../components/LatestFigures";
import { LogForm } from "../components/LogForm";
import styles from "./HomeScreen.module.css";

/**
 * The first screen: the form for logging a weight, and the latest figures
 * beside it on wide screens or below it on phones.
 */
export function HomeScreen() {
  return (
    <>
      <h1>Home</h1>
      <div className={styles.layout}>
        <Card>
          <LogForm />
        </Card>
        <Card>
          <LatestFigures />
        </Card>
      </div>
    </>
  );
}
