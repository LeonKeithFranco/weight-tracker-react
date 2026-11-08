import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Renders in StrictMode like the app does in development, so effects run
// twice and a missing cleanup shows up in tests.
configure({ reactStrictMode: true });

// Removes whatever the last test rendered, so each test starts with an empty page.
afterEach(() => {
  cleanup();
});
