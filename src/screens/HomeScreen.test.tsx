import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { calculateDailyFigures } from "../lib/dailyFigures";
import { buildDailySeries } from "../lib/dailySeries";
import { addDays, formatDate } from "../lib/dates";
import { estimateGoalDate } from "../lib/goalDate";
import type { WeightEntry } from "../lib/types";
import { DEFAULT_SETTINGS, AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { readableText } from "../test/readableText";
import { HomeScreen } from "./HomeScreen";

/**
 * Works out the goal date the card should show, from the calculations
 * themselves, so the test doesn't hard-code a date that depends on the maths.
 *
 * @param entries - The saved entries, with a 90 kg target.
 * @returns The goal date in the `D MMM YYYY` format.
 * @throws {@link Error}
 * When the entries don't give an estimated date.
 */
function expectedGoalText(entries: WeightEntry[]): string {
  const goal = estimateGoalDate(
    calculateDailyFigures(buildDailySeries(entries), 90),
    90,
  );
  if (goal.status !== "estimated") {
    throw new Error(`Expected an estimate, got ${goal.status}`);
  }
  return formatDate(goal.date, "D MMM YYYY");
}

describe("HomeScreen", () => {
  it("updates every figure and both dates when a weight is logged while the card is showing", async () => {
    const january = Array.from({ length: 31 }, (_, day) => ({
      date: addDays("2026-01-01", day),
      weightKg: 100 - day * 0.1,
    }));
    const february = { date: "2026-02-01", weightKg: 96 };
    const storage = new AppStorage(new InMemoryBackend());
    for (const entry of january) {
      await storage.saveEntry(entry);
    }
    await storage.saveSettings({
      ...DEFAULT_SETTINGS,
      displayUnit: "kg",
      targetWeightKg: 90,
      dateFormat: "D MMM YYYY",
    });
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <HomeScreen />
      </DataProvider>,
    );
    const figures = await screen.findByRole("region", {
      name: "Latest figures",
    });
    const figure = (term: string) =>
      readableText(
        within(figures).getByText(term, { selector: "dt" }).nextElementSibling!,
      );
    expect(await within(figures).findByText("As of 31 Jan 2026")).toBeVisible();
    expect(figure("Weight")).toBe("97.0 kg");
    const goalBefore = expectedGoalText(january);
    expect(figure("Goal date")).toBe(goalBefore);

    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), february.date);
    await user.type(screen.getByLabelText("Weight (kg)"), "96{Enter}");

    // A new month and a smaller day number, which the dates roll forward to.
    expect(await within(figures).findByText("As of 1 Feb 2026")).toBeVisible();
    expect(figure("Weight")).toBe("96.0 kg");
    expect(figure("Lowest weight")).toBe("96.0 kg");
    expect(figure("Lost since start")).toBe("4.0 kg");
    const goalAfter = expectedGoalText([...january, february]);
    expect(goalAfter).not.toBe(goalBefore);
    expect(figure("Goal date")).toBe(goalAfter);
  });

  it("updates the latest figures as soon as a weight is logged", async () => {
    const storage = new AppStorage(new InMemoryBackend());
    await storage.saveSettings({ ...DEFAULT_SETTINGS, displayUnit: "kg" });
    const user = userEvent.setup();
    render(
      <DataProvider storage={storage}>
        <HomeScreen />
      </DataProvider>,
    );
    const figures = await screen.findByRole("region", {
      name: "Latest figures",
    });
    expect(figures).toHaveTextContent("No entries yet");

    await user.type(screen.getByLabelText("Weight (kg)"), "92.4{Enter}");

    const weightTerm = await within(figures).findByText("Weight", {
      selector: "dt",
    });
    expect(weightTerm.nextElementSibling).toHaveTextContent("92.4 kg");
    expect(figures).not.toHaveTextContent("No entries yet");
  });
});
