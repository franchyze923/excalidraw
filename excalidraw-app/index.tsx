import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { PublicClientApplication } from "@azure/msal-browser";

import "../excalidraw-app/sentry";

import ExcalidrawApp from "./App";
import { AuthProvider } from "./components/AuthProvider";
import { msalConfig } from "./authConfig";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL before rendering
msalInstance.initialize().then(() => {
  window.__EXCALIDRAW_SHA__ = import.meta.env.VITE_APP_GIT_SHA;
  const rootElement = document.getElementById("root")!;
  const root = createRoot(rootElement);
  registerSW();
  root.render(
    <StrictMode>
      <AuthProvider msalInstance={msalInstance}>
        <ExcalidrawApp />
      </AuthProvider>
    </StrictMode>,
  );
});
