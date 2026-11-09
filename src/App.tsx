import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { DataScreen } from "./screens/DataScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LogScreen } from "./screens/LogScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

// Charts load in their own file the first time they're opened, because
// Recharts is most of the app's JavaScript and no other screen uses it.
// `lazy` expects a default export, so the named one is renamed.
const ChartsScreen = lazy(() =>
  import("./screens/ChartsScreen").then((module) => ({
    default: module.ChartsScreen,
  })),
);

export function App() {
  return (
    <Routes>
      {/* A layout route: every screen is drawn inside the app shell. */}
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route
          path="charts"
          element={
            // Shows nothing for the moment the file takes to load.
            <Suspense fallback={null}>
              <ChartsScreen />
            </Suspense>
          }
        />
        <Route path="data" element={<DataScreen />} />
        {/* No element, so it only groups the URLs that start with /settings. */}
        <Route path="settings">
          <Route index element={<SettingsScreen />} />
          <Route path="log" element={<LogScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
