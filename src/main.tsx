import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { App } from "./App.tsx";
import { DataProvider } from "./data/DataProvider.tsx";
import { installGlobalErrorHandlers } from "./errors/globalErrorHandlers.ts";
import { AppStorage } from "./storage/appStorage.ts";
import { DexieBackend } from "./storage/dexieBackend.ts";

// Created once, when the app starts, and shared by the whole app.
const storage = new AppStorage(new DexieBackend());

installGlobalErrorHandlers(window, storage);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DataProvider storage={storage}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DataProvider>
  </StrictMode>,
);
