import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WeightStorage } from "../storage/weightStorage";
import { AppErrorBoundary } from "./AppErrorBoundary";

/**
 * A stand-in for the app that always throws while rendering.
 *
 * @throws {@link Error}
 * Always, while rendering.
 */
function BrokenApp(): never {
  throw new Error("app broke");
}

describe("AppErrorBoundary", () => {
  beforeEach(() => {
    // React also prints caught errors to the console, which isn't needed here.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a fallback with a Reload button, and records the error", () => {
    const logger = { logError: vi.fn<WeightStorage["logError"]>() };

    render(
      <AppErrorBoundary logger={logger}>
        <BrokenApp />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(logger.logError).toHaveBeenCalledWith(
      "The app failed to render",
      expect.objectContaining({
        error: expect.objectContaining({ message: "app broke" }),
        componentStack: expect.stringContaining("BrokenApp"),
      }),
    );
  });
});
