import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { ChartsScreen } from "./screens/ChartsScreen";
import { DataScreen } from "./screens/DataScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LogScreen } from "./screens/LogScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export function App() {
  return (
    <Routes>
      {/* A layout route: every screen is drawn inside the app shell. */}
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path="charts" element={<ChartsScreen />} />
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
