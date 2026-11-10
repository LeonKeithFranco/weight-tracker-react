import { useId } from "react";
import { Link } from "react-router";
import { AboutApp } from "../components/AboutApp";
import { Card } from "../components/Card";
import { CsvExport } from "../components/CsvExport";
import { CsvImport } from "../components/CsvImport";
import { DateFormatForm } from "../components/DateFormatForm";
import { StorageStatus } from "../components/StorageStatus";
import { TargetWeightForm } from "../components/TargetWeightForm";
import { UnitSetting } from "../components/UnitSetting";
import styles from "../components/forms.module.css";
import { useData } from "../data/dataContext";
import layoutStyles from "./SettingsScreen.module.css";

/**
 * The settings, in two columns on wide screens: preferences for how the app
 * shows things, then the data's export, import, activity log, storage and
 * the app's version.
 */
export function SettingsScreen() {
  const { settings } = useData();
  const id = useId();

  return (
    <>
      <h1>Settings</h1>
      <div className={layoutStyles.layout}>
        {/* Preferences: how the app shows things. */}
        <div className={layoutStyles.column}>
          <Card>
            <UnitSetting />
          </Card>
          <Card>
            {/* A new key gives a fresh form, so the field shows the target in the new unit. */}
            <TargetWeightForm key={settings.displayUnit} />
          </Card>
          <Card>
            <DateFormatForm />
          </Card>
        </div>
        {/* Data: getting weigh-ins in and out, the record of changes, and
            whether the browser keeps them. About comes last, as in most
            apps' settings. */}
        <div className={layoutStyles.column}>
          <Card>
            <CsvExport />
          </Card>
          <Card>
            <CsvImport />
          </Card>
          <Card>
            <section
              className={styles.form}
              aria-labelledby={`${id}-log-heading`}
            >
              <h2 id={`${id}-log-heading`}>Activity log</h2>
              <p className={styles.hint}>
                Every change to your data, and any errors.
              </p>
              <Link to="/settings/log">View the activity log</Link>
            </section>
          </Card>
          <Card>
            <StorageStatus />
          </Card>
          <Card>
            <AboutApp />
          </Card>
        </div>
      </div>
    </>
  );
}
