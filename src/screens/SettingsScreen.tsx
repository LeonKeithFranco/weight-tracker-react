import { useId } from "react";
import { Link } from "react-router";
import { CsvExport } from "../components/CsvExport";
import { CsvImport } from "../components/CsvImport";
import { DateFormatForm } from "../components/DateFormatForm";
import { TargetWeightForm } from "../components/TargetWeightForm";
import { UnitSetting } from "../components/UnitSetting";
import styles from "../components/forms.module.css";
import { useData } from "../data/dataContext";

export function SettingsScreen() {
  const { settings } = useData();
  const id = useId();

  return (
    <>
      <h1>Settings</h1>
      <div className={styles.stack}>
        <UnitSetting />
        {/* A new key gives a fresh form, so the field shows the target in the new unit. */}
        <TargetWeightForm key={settings.displayUnit} />
        <DateFormatForm />
        <CsvExport />
        <CsvImport />
        <section className={styles.form} aria-labelledby={`${id}-log-heading`}>
          <h2 id={`${id}-log-heading`}>Activity log</h2>
          <p className={styles.hint}>
            Every change to your data, and any errors.
          </p>
          <Link to="/settings/log">View the activity log</Link>
        </section>
      </div>
    </>
  );
}
