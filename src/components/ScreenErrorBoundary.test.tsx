import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { ScreenErrorBoundary } from "./ScreenErrorBoundary";

/**
 * A stand-in for a screen that always throws while rendering.
 *
 * @throws {@link Error}
 * Always, while rendering.
 */
function BrokenScreen(): never {
  throw new Error("screen broke");
}

/** Whether {@link FlakyScreen} has stopped throwing. Reset before each test. */
let fixed = false;

/**
 * Throws until {@link fixed} is set, like an error that only happens once.
 *
 * @throws {@link Error}
 * While {@link fixed} is false.
 */
function FlakyScreen() {
  if (!fixed) {
    throw new Error("flaky");
  }
  return <p>Recovered</p>;
}

describe("ScreenErrorBoundary", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
    fixed = false;
    // React also prints caught errors to the console, which isn't needed here.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Renders the boundary the way the app shell does: navigation outside it,
   * and the screens inside it.
   *
   * @param startAt - The URL to open first, such as "/broken".
   * @returns A user event session for the test.
   */
  function renderScreens(startAt: string) {
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <MemoryRouter initialEntries={[startAt]}>
          <Link to="/fine">Go to the fine screen</Link>
          <ScreenErrorBoundary>
            <Routes>
              <Route path="/broken" element={<BrokenScreen />} />
              <Route path="/flaky" element={<FlakyScreen />} />
              <Route path="/fine" element={<p>Fine screen</p>} />
            </Routes>
          </ScreenErrorBoundary>
        </MemoryRouter>
      </DataProvider>,
    );
    return user;
  }

  it("shows a fallback instead of a screen that fails to render", async () => {
    renderScreens("/broken");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong",
    );
    expect(
      screen.getByRole("link", { name: "Go to the fine screen" }),
    ).toBeVisible();
  });

  it("records the error with the screen and the component it happened in", async () => {
    renderScreens("/broken");
    await screen.findByRole("alert");

    await vi.waitFor(async () => {
      expect(await storage.getLogEntries()).toContainEqual(
        expect.objectContaining({
          type: "error",
          message: "A screen failed to render",
          details: expect.objectContaining({
            screen: "/broken",
            error: expect.objectContaining({ message: "screen broke" }),
            componentStack: expect.stringContaining("BrokenScreen"),
          }),
        }),
      );
    });
  });

  it("clears the error when moving to another screen", async () => {
    const user = renderScreens("/broken");
    await screen.findByRole("alert");

    await user.click(
      screen.getByRole("link", { name: "Go to the fine screen" }),
    );

    expect(screen.getByText("Fine screen")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the screen again on Try again", async () => {
    const user = renderScreens("/flaky");
    await screen.findByRole("alert");

    fixed = true;
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Recovered")).toBeVisible();
  });
});
