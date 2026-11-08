import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { ChartsScreen } from "./screens/ChartsScreen";
import { DataScreen } from "./screens/DataScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export function App() {
  return (
    <Routes>
      {/* A layout route: every screen is drawn inside the app shell. */}
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path="charts" element={<ChartsScreen />} />
        <Route path="data" element={<DataScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
