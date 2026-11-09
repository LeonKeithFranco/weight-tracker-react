import { useId } from "react";
import { RANGE_PRESETS, type RangePreset } from "../lib/chartRange";
import styles from "./RangePresets.module.css";

type Props = {
  value: RangePreset;
  onChange: (preset: RangePreset) => void;
};

/**
 * Chooses how much history the charts show. Real radio buttons underneath, so
 * the arrow keys move between presets and screen readers announce one choice
 * from a group, even though they look like a row of buttons.
 */
export function RangePresets({ value, onChange }: Props) {
  const groupName = useId();

  return (
    <fieldset className={styles.presets}>
      <legend className="visually-hidden">Chart range</legend>
      {RANGE_PRESETS.map((preset) => (
        <label key={preset} className={styles.preset}>
          <input
            type="radio"
            className="visually-hidden"
            name={groupName}
            checked={value === preset}
            onChange={() => onChange(preset)}
          />
          {preset}
        </label>
      ))}
    </fieldset>
  );
}
