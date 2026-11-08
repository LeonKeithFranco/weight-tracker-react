import { DateFormatForm } from "../components/DateFormatForm";
import { TargetWeightForm } from "../components/TargetWeightForm";
import { UnitSetting } from "../components/UnitSetting";
import styles from "../components/forms.module.css";
import { useData } from "../data/dataContext";

export function SettingsScreen() {
  const { settings } = useData();

  return (
    <>
      <h1>Settings</h1>
      <div className={styles.stack}>
        <UnitSetting />
        {/* A new key gives a fresh form, so the field shows the target in the new unit. */}
        <TargetWeightForm key={settings.displayUnit} />
        <DateFormatForm />
      </div>
    </>
  );
}
