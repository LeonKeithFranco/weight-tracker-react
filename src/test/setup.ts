import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Renders in StrictMode like the app does in development, so effects run
// twice and a missing cleanup shows up in tests.
configure({ reactStrictMode: true });

// jsdom has `<dialog>` but not its methods, so tests get simple versions. Real
// browsers also block the rest of the page and fire `close` a moment later.
// Playwright checks the real behaviour.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event("close"));
};

// Removes whatever the last test rendered, so each test starts with an empty page.
afterEach(() => {
  cleanup();
});
