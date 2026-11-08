import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { describeError } from "../errors/describeError";
import type { WeightStorage } from "../storage/weightStorage";
import styles from "./forms.module.css";

function AppErrorFallback() {
  return (
    <main role="alert" className={styles.form}>
      <h1>Something went wrong</h1>
      <p>
        The app hit an error, which has been recorded in the activity log.
        Reloading the page usually fixes it.
      </p>
      <button type="button" onClick={() => window.location.reload()}>
        Reload
      </button>
    </main>
  );
}

type AppErrorBoundaryProps = {
  logger: Pick<WeightStorage, "logError">;
  children: ReactNode;
};

/**
 * The last line of defence, around the whole app, for an error outside any
 * screen. It sits above `DataProvider`, so it records through storage
 * directly rather than `useData`.
 */
export function AppErrorBoundary({ logger, children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onError={(error, info) => {
        void logger.logError("The app failed to render", {
          error: describeError(error),
          componentStack: info.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
