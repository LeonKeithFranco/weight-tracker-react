import { startTransition, useId, useOptimistic, useState } from "react";
import { useData } from "../data/dataContext";
import type { WeightUnit } from "../lib/types";
import styles from "./forms.module.css";

const UNITS: { unit: WeightUnit; label: string }[] = [
  { unit: "lb", label: "Pounds (lb)" },
  { unit: "kg", label: "Kilograms (kg)" },
];

/** Chooses the unit weights are entered and shown in. Saves on each change. */
export function UnitSetting() {
  const { settings, saveSettings } = useData();
  const groupName = useId();
  const [saveFailed, setSaveFailed] = useState(false);
  // Shows the chosen unit straight away while it saves. Once saving ends, it
  // follows the saved unit again, so a failed save goes back to the old one.
  const [shownUnit, setShownUnit] = useOptimistic(settings.displayUnit);

  function changeUnit(displayUnit: WeightUnit) {
    setSaveFailed(false);
    startTransition(async () => {
      setShownUnit(displayUnit);
      try {
        await saveSettings({ ...settings, displayUnit });
      } catch {
        setSaveFailed(true);
      }
    });
  }

  return (
    <fieldset className={styles.form}>
      <legend>Display unit</legend>
      {/* One item in the form's layout, so the rows sit without a gap. */}
      <div>
        {UNITS.map(({ unit, label }) => (
          <label key={unit} className={styles.choice}>
            <input
              type="radio"
              // Radio buttons with the same name form one group.
              name={groupName}
              checked={shownUnit === unit}
              onChange={() => changeUnit(unit)}
            />
            {label}
          </label>
        ))}
      </div>
      {saveFailed && (
        <p role="alert" className={styles.error}>
          Couldn't save the unit. Try again.
        </p>
      )}
    </fieldset>
  );
}
