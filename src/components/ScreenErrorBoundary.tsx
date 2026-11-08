import type { ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useLocation } from "react-router";
import { useData } from "../data/dataContext";
import { describeError } from "../errors/describeError";
import styles from "./forms.module.css";

function ScreenErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className={styles.form}>
      <h1>Something went wrong</h1>
      <p>
        This screen hit an error, which has been recorded in the activity log.
        The other screens still work.
      </p>
      <button type="button" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}

/**
 * Catches an error while a screen renders, records it, and shows a fallback in
 * place of the screen. The navigation stays usable, and moving to another
 * screen clears the error.
 */
export function ScreenErrorBoundary({ children }: { children: ReactNode }) {
  const { logError } = useData();
  const { pathname } = useLocation();

  return (
    <ErrorBoundary
      FallbackComponent={ScreenErrorFallback}
      // Starts again with the screen, not the fallback, when the URL changes.
      resetKeys={[pathname]}
      onError={(error, info) => {
        void logError("A screen failed to render", {
          screen: pathname,
          error: describeError(error),
          componentStack: info.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
