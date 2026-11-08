import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Removes whatever the last test rendered, so each test starts with an empty page.
afterEach(() => {
  cleanup();
});
