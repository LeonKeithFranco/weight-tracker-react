/**
 * Turns anything that was thrown into plain data the activity log can store.
 * JavaScript can throw any value, not only an `Error`.
 */
export function describeError(value: unknown): Record<string, unknown> {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return { value: String(value) };
}
