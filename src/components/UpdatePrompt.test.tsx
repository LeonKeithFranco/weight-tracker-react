import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  useRegisterSW,
  type RegisterSWOptions,
} from "virtual:pwa-register/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { UpdatePrompt } from "./UpdatePrompt";

// jsdom has no service workers, so the plugin's hook is replaced. Playwright
// checks the real one against a production build.
vi.mock("virtual:pwa-register/react", () => ({ useRegisterSW: vi.fn() }));

describe("UpdatePrompt", () => {
  let storage: AppStorage;
  // What the fake hook reports, and what the component passed to it.
  let updateWaiting: boolean;
  let options: RegisterSWOptions | undefined;
  const updateServiceWorker = vi.fn(() => Promise.resolve());

  /**
   * Stands in for `useRegisterSW`. It's a hook itself, so it can keep the
   * "update waiting" flag in state, as the real one does.
   *
   * @param given - The options the component passed, kept for the test.
   * @returns The same fields as the real hook.
   */
  function useFakeRegisterSW(given?: RegisterSWOptions) {
    options = given;
    const needRefresh = useState(updateWaiting);
    return {
      needRefresh,
      offlineReady: useState(false),
      updateServiceWorker,
    };
  }

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
    updateWaiting = false;
    options = undefined;
    vi.mocked(useRegisterSW).mockImplementation(useFakeRegisterSW);
  });

  afterEach(() => {
    updateServiceWorker.mockClear();
  });

  /**
   * Renders the prompt and waits for it, because `DataProvider` shows nothing
   * until its first load finishes.
   *
   * @returns A user event session and the prompt's status region.
   */
  async function renderPrompt() {
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <UpdatePrompt />
      </DataProvider>,
    );
    const status = await screen.findByRole("status");
    return { user, status };
  }

  it("shows nothing while no update is waiting", async () => {
    const { status } = await renderPrompt();

    expect(status).toBeEmptyDOMElement();
  });

  it("reloads into the new version when asked", async () => {
    updateWaiting = true;
    const { user, status } = await renderPrompt();

    expect(status).toHaveTextContent("A new version is ready.");
    await user.click(screen.getByRole("button", { name: "Reload" }));

    expect(updateServiceWorker).toHaveBeenCalledOnce();
  });

  it("hides until next time when put off", async () => {
    updateWaiting = true;
    const { user, status } = await renderPrompt();

    await user.click(screen.getByRole("button", { name: "Later" }));

    expect(status).toBeEmptyDOMElement();
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });

  it("records a failed registration in the activity log", async () => {
    await renderPrompt();

    options?.onRegisterError?.(new Error("Blocked by the browser"));

    await vi.waitFor(async () => {
      expect(await storage.getLogEntries()).toContainEqual(
        expect.objectContaining({
          message: "Couldn't set up offline use",
          details: { error: "Error: Blocked by the browser" },
        }),
      );
    });
  });
});
