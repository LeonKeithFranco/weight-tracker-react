import { useRegisterSW } from "virtual:pwa-register/react";
import { useData } from "../data/dataContext";
import styles from "./UpdatePrompt.module.css";

/**
 * Registers the service worker, and offers to reload when a new version of
 * the app is waiting. The new version only takes over after a reload, so a
 * half-typed weight is never lost to an update.
 */
export function UpdatePrompt() {
  const { logError } = useData();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      void logError("Couldn't set up offline use", { error: String(error) });
    },
  });

  return (
    // Always in the page, because screen readers only announce changes to a
    // status that's already there.
    <div role="status" className={styles.region}>
      {needRefresh && (
        <div className={styles.card}>
          <p className={styles.message}>A new version is ready.</p>
          <div className={styles.actions}>
            {/* Tells the waiting version to take over, then reloads. */}
            <button type="button" onClick={() => void updateServiceWorker()}>
              Reload
            </button>
            {/* The new version still takes over the next time the app opens. */}
            <button type="button" onClick={() => setNeedRefresh(false)}>
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
