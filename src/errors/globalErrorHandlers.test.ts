import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { WeightStorage } from "../storage/weightStorage";
import { installGlobalErrorHandlers } from "./globalErrorHandlers";

/**
 * Builds an event shaped like the browser's `ErrorEvent`.
 *
 * @remarks
 * Node has `EventTarget` and `Event`, but not the browser's `ErrorEvent` or
 * `PromiseRejectionEvent`, so this and {@link rejectionEvent} build plain
 * events with the same fields.
 *
 * @param fields - The `ErrorEvent` fields to set, such as `message`.
 * @returns An `error` event with those fields.
 */
function errorEvent(fields: Record<string, unknown>): Event {
  return Object.assign(new Event("error"), fields);
}

/**
 * Builds an event shaped like the browser's `PromiseRejectionEvent`.
 *
 * @param reason - What the promise was rejected with.
 * @returns An `unhandledrejection` event with that `reason`.
 */
function rejectionEvent(reason: unknown): Event {
  return Object.assign(new Event("unhandledrejection"), { reason });
}

describe("installGlobalErrorHandlers", () => {
  let target: EventTarget;
  let logger: { logError: Mock<WeightStorage["logError"]> };

  beforeEach(() => {
    target = new EventTarget();
    logger = { logError: vi.fn<WeightStorage["logError"]>() };
  });

  it("records an uncaught error with where it happened", () => {
    installGlobalErrorHandlers(target, logger);
    const error = new Error("boom");

    target.dispatchEvent(
      errorEvent({
        message: "Uncaught Error: boom",
        error,
        filename: "http://localhost/app.js",
        lineno: 12,
        colno: 5,
      }),
    );

    expect(logger.logError).toHaveBeenCalledWith("Uncaught Error: boom", {
      error: { name: "Error", message: "boom", stack: error.stack },
      source: "http://localhost/app.js",
      line: 12,
      column: 5,
    });
  });

  it("records an unhandled promise rejection", () => {
    installGlobalErrorHandlers(target, logger);

    target.dispatchEvent(rejectionEvent("network down"));

    expect(logger.logError).toHaveBeenCalledWith(
      "Unhandled promise rejection",
      { reason: { value: "network down" } },
    );
  });

  it("stops recording once removed", () => {
    const remove = installGlobalErrorHandlers(target, logger);

    remove();
    target.dispatchEvent(errorEvent({ message: "boom" }));
    target.dispatchEvent(rejectionEvent("boom"));

    expect(logger.logError).not.toHaveBeenCalled();
  });
});
