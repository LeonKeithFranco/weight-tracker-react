import type { WeightStorage } from "../storage/weightStorage";
import { describeError } from "./describeError";

/**
 * The one storage method the handlers need, so tests can pass a fake with
 * only that.
 */
type ErrorLogger = Pick<WeightStorage, "logError">;

/**
 * Records errors that nothing else caught, such as one thrown in a timer or an
 * event handler, or a rejected promise with no `catch`. The browser reports
 * these as events on `window`.
 *
 * @remarks
 * Errors thrown while React renders are caught by the error boundaries
 * instead, and never reach these handlers.
 *
 * @param target - Where the browser reports the errors: `window` in the app,
 * or a plain `EventTarget` in tests.
 * @param logger - Where the errors are recorded.
 * @returns A function that removes the handlers.
 */
export function installGlobalErrorHandlers(
  target: EventTarget,
  logger: ErrorLogger,
): () => void {
  function handleError(event: Event) {
    const { message, error, filename, lineno, colno } = event as ErrorEvent;
    void logger.logError(message || "Uncaught error", {
      error: describeError(error),
      source: filename,
      line: lineno,
      column: colno,
    });
  }

  function handleRejection(event: Event) {
    const { reason } = event as PromiseRejectionEvent;
    void logger.logError("Unhandled promise rejection", {
      reason: describeError(reason),
    });
  }

  target.addEventListener("error", handleError);
  target.addEventListener("unhandledrejection", handleRejection);

  return () => {
    target.removeEventListener("error", handleError);
    target.removeEventListener("unhandledrejection", handleRejection);
  };
}
