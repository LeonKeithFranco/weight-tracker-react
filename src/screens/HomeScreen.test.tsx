import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { DataProvider } from "../data/DataProvider";
import { DEFAULT_SETTINGS, AppStorage } from "../storage/appStorage";
import { InMemoryBackend } from "../storage/inMemoryBackend";
import { HomeScreen } from "./HomeScreen";

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
