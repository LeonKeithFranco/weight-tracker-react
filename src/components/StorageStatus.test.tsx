import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import type { PersistenceApi } from "../storage/persistence";
import { StorageStatus } from "./StorageStatus";

describe("StorageStatus", () => {
  let storage: AppStorage;

  beforeEach(() => {
    // No entries, so the app doesn't ask on its own and only the button does.
    storage = new AppStorage(new InMemoryBackend());
  });

  /**
   * Builds a stand-in for `navigator.storage` with the given answers.
   *
   * @param persisted - What `persisted()` resolves to.
   * @param grant - What `persist()` resolves to, the same as `persisted` by
   * default.
   * @returns A fake whose methods are Vitest mocks.
   */
  function fakeBrowser(persisted: boolean, grant = persisted): PersistenceApi {
    return {
      persisted: vi.fn(() => Promise.resolve(persisted)),
      persist: vi.fn(() => Promise.resolve(grant)),
    };
  }

  async function renderStatus(persistenceApi?: PersistenceApi) {
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage} persistenceApi={persistenceApi}>
        <StorageStatus />
      </DataProvider>,
    );
    const card = await screen.findByRole("region", { name: "Storage" });
    return { user, card };
  }

  it("says persistent storage keeps the data, with no button", async () => {
    const { card } = await renderStatus(fakeBrowser(true));

    expect(card).toHaveTextContent(
      "Your browser keeps this data until you clear it or uninstall the app.",
    );
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("says when the browser can't promise anything, with no button", async () => {
    const { card } = await renderStatus();

    expect(card).toHaveTextContent(
      "This browser can't promise to keep this data.",
    );
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("always suggests a CSV backup", async () => {
    const { card } = await renderStatus(fakeBrowser(true));

    expect(card).toHaveTextContent("Export a CSV now and then as a backup.");
  });

  it("asks again when best-effort, and shows that the browser agreed", async () => {
    const { user, card } = await renderStatus(fakeBrowser(false, true));
    const button = within(card).getByRole("button", {
      name: "Ask to keep data",
    });
    expect(button).toHaveAccessibleDescription(
      expect.stringContaining("may delete this data"),
    );

    await user.click(button);

    expect(within(card).getByRole("status")).toHaveTextContent(
      "Your browser will now keep this data.",
    );
    expect(card).toHaveTextContent("Your browser keeps this data");
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("says when the browser refuses, and keeps the button", async () => {
    const { user, card } = await renderStatus(fakeBrowser(false, false));

    await user.click(
      within(card).getByRole("button", { name: "Ask to keep data" }),
    );

    expect(within(card).getByRole("status")).toHaveTextContent(
      "Your browser said no. Try again after installing the app.",
    );
    expect(
      within(card).getByRole("button", { name: "Ask to keep data" }),
    ).toBeInTheDocument();
  });
});
