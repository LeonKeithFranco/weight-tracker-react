import type { LogFormErrors } from "../lib/logForm";

/**
 * What to show for each weight problem, in the log form and the edit dialog.
 */
export const WEIGHT_MESSAGES: Record<
  NonNullable<LogFormErrors["weight"]>,
  string
> = {
  missing: "Enter your weight.",
  invalid: "Enter a number above 0, such as 203.8.",
};
