import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { calculateDailyFigures } from "../lib/dailyFigures";
import { buildDailySeries } from "../lib/dailySeries";
import { addDays, formatDate } from "../lib/dates";
import { estimateGoalDate } from "../lib/goalDate";
import type { Settings, WeightEntry } from "../lib/types";
import { AppStorage, DEFAULT_SETTINGS } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { readableText } from "../test/readableText";
import { LatestFigures } from "./LatestFigures";

/** One entry per day from 2026-01-01, with these weights in kg. */
function dailyEntries(weightsKg: number[]): WeightEntry[] {
  return weightsKg.map((weightKg, index) => ({
    date: addDays("2026-01-01", index),
    weightKg,
  }));
}

describe("LatestFigures", () => {
  let storage: AppStorage;

  beforeEach(() => {
    storage = new AppStorage(new InMemoryBackend());
  });

  async function renderFigures(
    entries: WeightEntry[],
    settings: Partial<Settings> = {},
  ) {
    for (const entry of entries) {
      await storage.saveEntry(entry);
    }
    await storage.saveSettings({ ...DEFAULT_SETTINGS, ...settings });
    render(
      <DataProvider storage={storage}>
        <LatestFigures />
      </DataProvider>,
    );
    await screen.findByRole("heading", { name: "Latest figures" });
  }

  /** The text a screen reader reads next to a figure's name, or `null` if it isn't shown. */
  function figure(term: string): string | null {
    const value = screen.queryByText(term, {
      selector: "dt",
    })?.nextElementSibling;
    return value ? readableText(value) : null;
  }

  it("asks for a first entry when there are none", async () => {
    await renderFigures([]);

    expect(
      screen.getByText("No entries yet. Log your first weight above."),
    ).toBeVisible();
  });

  it("shows the latest day's figures in kg", async () => {
    await renderFigures(dailyEntries([90, 89, 88]), {
      displayUnit: "kg",
      targetWeightKg: 80,
    });

    expect(screen.getByText("As of 2026-01-03")).toBeVisible();
    expect(figure("Weight")).toBe("88.0 kg");
    expect(figure("7-day average")).toBe("89.00 kg");
    expect(figure("7-day change")).toBe("-1.11%");
    expect(figure("28-day average")).toBe("89.00 kg");
    expect(figure("Lowest weight")).toBe("88.0 kg");
    expect(figure("Left to lose")).toBe("8.0 kg");
    expect(figure("Lost since start")).toBe("2.0 kg");
    expect(figure("Loss per week")).toBe("7.00 kg");
  });

  it("converts the figures to lb, and uses the date format", async () => {
    await renderFigures(dailyEntries([90, 89, 88]), {
      displayUnit: "lb",
      targetWeightKg: 80,
      dateFormat: "D MMM YYYY",
    });

    expect(screen.getByText("As of 3 Jan 2026")).toBeVisible();
    expect(figure("Weight")).toBe("194.0 lb");
    expect(figure("7-day average")).toBe("196.21 lb");
    expect(figure("Left to lose")).toBe("17.6 lb");
    expect(figure("Loss per week")).toBe("15.43 lb");
  });

  it("leaves out the target figures when there's no target", async () => {
    await renderFigures(dailyEntries([90, 89, 88]), { targetWeightKg: null });

    expect(figure("Left to lose")).toBeNull();
    expect(figure("Goal date")).toBeNull();
  });

  describe("goal date", () => {
    it("needs 14 days of data", async () => {
      await renderFigures(dailyEntries([90, 89, 88]), { targetWeightKg: 80 });

      expect(figure("Goal date")).toBe("Not enough data");
    });

    it("says when the target is reached", async () => {
      await renderFigures(dailyEntries(Array(14).fill(79)), {
        targetWeightKg: 80,
      });

      expect(figure("Goal date")).toBe("Target reached");
    });

    it("gives no estimate when the trend is flat", async () => {
      await renderFigures(dailyEntries(Array(20).fill(85)), {
        targetWeightKg: 80,
      });

      expect(figure("Goal date")).toBe("No estimate");
    });

    it("shows the projected date in the date format", async () => {
      const entries = dailyEntries(
        Array.from({ length: 20 }, (_, day) => 90 - day * 0.2),
      );
      await renderFigures(entries, {
        targetWeightKg: 80,
        dateFormat: "D MMM YYYY",
      });

      // The date itself is tested in `goalDate.test.ts`. This checks that the
      // screen shows the same one, formatted.
      const goal = estimateGoalDate(
        calculateDailyFigures(buildDailySeries(entries), 80),
        80,
      );
      if (goal.status !== "estimated") {
        throw new Error(`Expected an estimate, got ${goal.status}`);
      }
      expect(figure("Goal date")).toBe(formatDate(goal.date, "D MMM YYYY"));
    });
  });
});
