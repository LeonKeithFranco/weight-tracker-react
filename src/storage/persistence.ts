/**
 * Whether the browser keeps the app's data until the user deletes it.
 *
 * - `persistent`: only the user can delete it, by clearing site data or
 *   uninstalling.
 * - `best-effort`: the browser may delete it without asking when the device
 *   runs low on space. This is every site's default.
 * - `unsupported`: the browser can't say or can't change it, such as on a
 *   page served over plain HTTP, where `navigator.storage` doesn't exist.
 */
export type Persistence = "persistent" | "best-effort" | "unsupported";

/** The two methods of the browser's `navigator.storage` this app uses. */
export type PersistenceApi = Pick<StorageManager, "persisted" | "persist">;

/**
 * Reads the current state without asking for anything.
 *
 * @param api - The browser's `navigator.storage`, or `undefined` where it
 * doesn't exist. Tests pass a fake.
 * @returns Whether storage is persistent, best-effort or unsupported.
 * @throws The browser's error, if it fails to answer.
 */
export async function checkPersistence(
  api: PersistenceApi | undefined,
): Promise<Persistence> {
  if (api === undefined) return "unsupported";
  return (await api.persisted()) ? "persistent" : "best-effort";
}

/**
 * Asks the browser to make storage persistent. Chrome decides on its own,
 * mostly from whether the app is installed. Firefox asks the user.
 *
 * @param api - The browser's `navigator.storage`, or `undefined` where it
 * doesn't exist. Tests pass a fake.
 * @returns The state after the browser answers: persistent if it agreed,
 * best-effort if it refused, or unsupported.
 * @throws The browser's error, if it fails to answer.
 */
export async function requestPersistence(
  api: PersistenceApi | undefined,
): Promise<Persistence> {
  if (api === undefined) return "unsupported";
  return (await api.persist()) ? "persistent" : "best-effort";
}
