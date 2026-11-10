import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { localToday } from "../lib/dates";
import type { Settings } from "../lib/types";
import { KG_PER_LB } from "../lib/units";
import { AppStorage, DEFAULT_SETTINGS } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { LogForm } from "./LogForm";

describe("LogForm", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Renders the form with saved data, and waits for it to appear.
   *
   * @param settings - Settings to save over the defaults first.
   * @returns A user event session for the test.
   */
  async function renderForm(settings: Partial<Settings> = {}) {
    await storage.saveSettings({ ...DEFAULT_SETTINGS, ...settings });
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <LogForm />
      </DataProvider>,
    );
    await screen.findByRole("heading", { name: "Log your weight" });
    return user;
  }

  function saveButton() {
    return screen.getByRole("button", { name: "Save" });
  }

  it("defaults the date to today", async () => {
    await renderForm();

    expect(screen.getByLabelText("Date")).toHaveValue(localToday());
  });

  it("saves a weight in the display unit as kg, then clears the weight", async () => {
    const user = await renderForm({ displayUnit: "lb" });

    await user.type(screen.getByLabelText("Weight (lb)"), "203.8");
    await user.click(saveButton());

    expect(await screen.findByRole("status")).toHaveTextContent(
      `Saved 203.8 lb for ${localToday()}.`,
    );
    expect(await storage.getEntries()).toEqual([
      { date: localToday(), weightKg: 203.8 * KG_PER_LB },
    ]);
    expect(screen.getByLabelText("Weight (lb)")).toHaveValue("");
  });

  it("uses kg when that's the display unit", async () => {
    const user = await renderForm({ displayUnit: "kg" });

    await user.type(screen.getByLabelText("Weight (kg)"), "92.4");
    await user.click(saveButton());

    await screen.findByText(`Saved 92.4 kg for ${localToday()}.`);
    expect(await storage.getEntries()).toEqual([
      { date: localToday(), weightKg: 92.4 },
    ]);
  });

  it("saves when Enter is pressed", async () => {
    const user = await renderForm({ displayUnit: "kg" });

    await user.type(screen.getByLabelText("Weight (kg)"), "92.4{Enter}");

    await screen.findByText(`Saved 92.4 kg for ${localToday()}.`);
  });

  it("logs an earlier date, replacing the entry already saved for it", async () => {
    await storage.saveEntry({ date: "2026-01-01", weightKg: 95 });
    const user = await renderForm({ displayUnit: "kg" });

    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2026-01-01");
    await user.type(screen.getByLabelText("Weight (kg)"), "92.4");
    await user.click(saveButton());

    await screen.findByText("Saved 92.4 kg for 2026-01-01.");
    expect(await storage.getEntries()).toEqual([
      { date: "2026-01-01", weightKg: 92.4 },
    ]);
  });

  it("shows an error on the field, and saves nothing, when the weight is missing", async () => {
    const user = await renderForm();

    await user.click(saveButton());

    const weight = screen.getByLabelText("Weight (lb)");
    expect(weight).toHaveAttribute("aria-invalid", "true");
    expect(weight).toHaveAccessibleDescription("Enter your weight.");
    expect(await storage.getEntries()).toEqual([]);
  });

  it("rejects a weight that isn't a number above 0", async () => {
    const user = await renderForm();

    await user.type(screen.getByLabelText("Weight (lb)"), "abc");
    await user.click(saveButton());

    expect(screen.getByLabelText("Weight (lb)")).toHaveAccessibleDescription(
      "Enter a number above 0, such as 203.8.",
    );
    expect(await storage.getEntries()).toEqual([]);
  });

  it("rejects a future date", async () => {
    const user = await renderForm();

    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2099-01-01");
    await user.type(screen.getByLabelText("Weight (lb)"), "203.8");
    await user.click(saveButton());

    expect(screen.getByLabelText("Date")).toHaveAccessibleDescription(
      "The date can't be in the future.",
    );
    expect(await storage.getEntries()).toEqual([]);
  });

  it("keeps the weight in the form if saving fails", async () => {
    vi.spyOn(storage, "saveEntry").mockRejectedValue(new Error("disk full"));
    const user = await renderForm();

    await user.type(screen.getByLabelText("Weight (lb)"), "203.8");
    await user.click(saveButton());

    await screen.findByText(
      "Couldn't save. Your entry is still in the form, so try again.",
    );
    expect(screen.getByLabelText("Weight (lb)")).toHaveValue("203.8");
  });

  it("clears the saved message once a field changes", async () => {
    const user = await renderForm();

    await user.type(screen.getByLabelText("Weight (lb)"), "203.8{Enter}");
    await screen.findByText(/^Saved/);
    await user.type(screen.getByLabelText("Weight (lb)"), "2");

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
