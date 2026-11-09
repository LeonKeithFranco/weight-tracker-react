import { Card } from "../components/Card";
import { LatestFigures } from "../components/LatestFigures";
import { LogForm } from "../components/LogForm";
import styles from "../components/forms.module.css";

export function HomeScreen() {
  return (
    <>
      <h1>Home</h1>
      <div className={styles.stack}>
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
