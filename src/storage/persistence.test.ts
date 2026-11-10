import { describe, expect, it, vi } from "vitest";
import {
  checkPersistence,
  requestPersistence,
  type PersistenceApi,
} from "./persistence";

/**
 * Builds a stand-in for `navigator.storage` that answers as given.
 *
 * @param persisted - What `persisted()` resolves to.
 * @param granted - What `persist()` resolves to, the same as `persisted` by
 * default.
 * @returns A fake whose methods are Vitest mocks.
 */
function fakeApi(persisted: boolean, granted = persisted): PersistenceApi {
  return {
    persisted: vi.fn(() => Promise.resolve(persisted)),
    persist: vi.fn(() => Promise.resolve(granted)),
  };
}

describe("checkPersistence", () => {
  it("reports persistent storage", async () => {
    expect(await checkPersistence(fakeApi(true))).toBe("persistent");
  });

  it("reports best-effort storage, without asking for more", async () => {
    const api = fakeApi(false);

    expect(await checkPersistence(api)).toBe("best-effort");
    expect(api.persist).not.toHaveBeenCalled();
  });

  it("reports a browser without the API as unsupported", async () => {
    expect(await checkPersistence(undefined)).toBe("unsupported");
  });
});

describe("requestPersistence", () => {
  it("reports persistent storage when the browser agrees", async () => {
    expect(await requestPersistence(fakeApi(false, true))).toBe("persistent");
  });

  it("stays best-effort when the browser refuses", async () => {
    expect(await requestPersistence(fakeApi(false, false))).toBe("best-effort");
  });

  it("reports a browser without the API as unsupported", async () => {
    expect(await requestPersistence(undefined)).toBe("unsupported");
  });
});
