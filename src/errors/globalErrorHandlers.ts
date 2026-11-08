import type { WeightStorage } from "../storage/weightStorage";
import { describeError } from "./describeError";

type ErrorLogger = Pick<WeightStorage, "logError">;

/**
 * Records errors that nothing else caught, such as one thrown in a timer or an
 * event handler, or a rejected promise with no `catch`. The browser reports
 * these as events on `window`.
 *
 * Errors thrown while React renders are caught by the error boundaries
 * instead, and never reach these handlers.
 *
 * Returns a function that removes the handlers.
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
