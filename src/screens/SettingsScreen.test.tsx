import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataProvider } from "../data/DataProvider";
import type { Settings } from "../lib/types";
import { KG_PER_LB } from "../lib/units";
import { AppStorage, DEFAULT_SETTINGS } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { SettingsScreen } from "./SettingsScreen";

describe("SettingsScreen", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Renders the screen with saved settings, and waits for it to appear. */
  async function renderSettings(settings: Partial<Settings> = {}) {
    await storage.saveSettings({ ...DEFAULT_SETTINGS, ...settings });
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <SettingsScreen />
      </DataProvider>,
    );
    await screen.findByRole("heading", { name: "Settings" });
    return user;
  }

  function targetField(unit: "kg" | "lb") {
    return screen.getByLabelText(`Target weight (${unit})`);
  }

  /** The Save button inside the form with this name. */
  function saveButton(formName: string) {
    return within(screen.getByRole("form", { name: formName })).getByRole(
      "button",
      { name: "Save" },
    );
  }

  function saveTarget() {
    return saveButton("Target");
  }

  describe("display unit", () => {
    it("shows the saved unit", async () => {
      await renderSettings({ displayUnit: "lb" });

      expect(screen.getByLabelText("Pounds (lb)")).toBeChecked();
      expect(screen.getByLabelText("Kilograms (kg)")).not.toBeChecked();
    });

    it("saves a new unit as soon as it's chosen", async () => {
      const user = await renderSettings({ displayUnit: "lb" });

      await user.click(screen.getByLabelText("Kilograms (kg)"));

      expect(screen.getByLabelText("Kilograms (kg)")).toBeChecked();
      expect((await storage.getSettings()).displayUnit).toBe("kg");
    });

    it("stays on the saved unit, with an alert, if saving fails", async () => {
      const user = await renderSettings({ displayUnit: "lb" });
      vi.spyOn(storage, "saveSettings").mockRejectedValue(new Error("full"));

      await user.click(screen.getByLabelText("Kilograms (kg)"));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn't save the unit. Try again.",
      );
      expect(screen.getByLabelText("Pounds (lb)")).toBeChecked();
    });
  });

  describe("target weight", () => {
    it("saves a target entered in the display unit", async () => {
      const user = await renderSettings({ displayUnit: "lb" });

      await user.type(targetField("lb"), "180");
      await user.click(saveTarget());

      expect(await screen.findByText("Target saved.")).toBeInTheDocument();
      expect((await storage.getSettings()).targetWeightKg).toBe(
        180 * KG_PER_LB,
      );
      expect(targetField("lb")).toHaveValue("180.0");
    });

    it("removes the target when the field is emptied", async () => {
      const user = await renderSettings({ targetWeightKg: 82 });

      await user.clear(targetField("lb"));
      await user.click(saveTarget());

      expect(await screen.findByText("Target removed.")).toBeInTheDocument();
      expect((await storage.getSettings()).targetWeightKg).toBeNull();
    });

    it("keeps the full-precision target when saved without changes", async () => {
      const user = await renderSettings({
        displayUnit: "lb",
        targetWeightKg: 82,
      });
      expect(targetField("lb")).toHaveValue("180.8");

      await user.click(saveTarget());

      await screen.findByText("Target saved.");
      expect((await storage.getSettings()).targetWeightKg).toBe(82);
    });

    it("rejects a target that isn't a number above 0", async () => {
      const user = await renderSettings({ targetWeightKg: 82 });

      await user.clear(targetField("lb"));
      await user.type(targetField("lb"), "abc");
      await user.click(saveTarget());

      expect(targetField("lb")).toHaveAttribute("aria-invalid", "true");
      expect(targetField("lb")).toHaveAccessibleDescription(
        "Leave empty for no target. Enter a number above 0, or leave it empty.",
      );
      expect((await storage.getSettings()).targetWeightKg).toBe(82);
    });

    it("shows the target in the new unit when the unit changes", async () => {
      const user = await renderSettings({
        displayUnit: "lb",
        targetWeightKg: 82,
      });

      await user.click(screen.getByLabelText("Kilograms (kg)"));

      expect(await screen.findByLabelText("Target weight (kg)")).toHaveValue(
        "82.0",
      );
    });
  });

  describe("date format", () => {
    beforeEach(() => {
      // Fakes only the date, so user-event's and Testing Library's timers
      // still run normally.
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 10, 7, 12, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function formatField() {
      return screen.getByLabelText("Date format");
    }

    it("shows the saved format with a preview of today", async () => {
      await renderSettings({ dateFormat: "DD/MM/YYYY" });

      expect(formatField()).toHaveValue("DD/MM/YYYY");
      expect(formatField()).toHaveAccessibleDescription(
        /Today shows as: 07\/11\/2026/,
      );
    });

    it("updates the preview as you type", async () => {
      const user = await renderSettings();

      await user.clear(formatField());
      await user.type(formatField(), "D MMM YYYY");

      expect(screen.getByText("Today shows as: 7 Nov 2026")).toBeVisible();
    });

    it("saves the format without spaces around it", async () => {
      const user = await renderSettings();

      await user.clear(formatField());
      await user.type(formatField(), " D MMM YYYY ");
      await user.click(saveButton("Dates"));

      expect(await screen.findByText("Date format saved.")).toBeVisible();
      expect((await storage.getSettings()).dateFormat).toBe("D MMM YYYY");
    });

    it("previews and saves the default when the field is empty", async () => {
      const user = await renderSettings({ dateFormat: "DD/MM/YYYY" });

      await user.clear(formatField());
      expect(screen.getByText("Today shows as: 2026-11-07")).toBeVisible();
      await user.click(saveButton("Dates"));

      await screen.findByText("Date format saved.");
      expect((await storage.getSettings()).dateFormat).toBe("YYYY-MM-DD");
      expect(formatField()).toHaveValue("YYYY-MM-DD");
    });

    it("says so if saving fails", async () => {
      const user = await renderSettings();
      vi.spyOn(storage, "saveSettings").mockRejectedValue(new Error("full"));

      await user.click(saveButton("Dates"));

      expect(
        await screen.findByText("Couldn't save the date format. Try again."),
      ).toBeVisible();
    });
  });
});
