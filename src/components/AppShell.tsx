import { NavLink, Outlet } from "react-router";
import styles from "./AppShell.module.css";
import { ScreenErrorBoundary } from "./ScreenErrorBoundary";

const screens = [
  { path: "/", label: "Home" },
  { path: "/charts", label: "Charts" },
  { path: "/data", label: "Data" },
  { path: "/settings", label: "Settings" },
];

/** The header and navigation that stay in place while screens change. */
export function AppShell() {
  return (
    <>
      <header className={styles.header}>
        <span className={styles.appName}>Weight Tracker</span>
        <nav className={styles.nav} aria-label="Screens">
          {screens.map((screen) => (
            <NavLink
              key={screen.path}
              to={screen.path}
              // Without `end`, "/" would count as active on every screen.
              end={screen.path === "/"}
              className={styles.link}
            >
              {screen.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <ScreenErrorBoundary>
          <Outlet />
        </ScreenErrorBoundary>
      </main>
    </>
  );
}
