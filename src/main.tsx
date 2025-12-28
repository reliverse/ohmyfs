import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "~/components/theme-provider";
import { getRouter } from "./router";

import "./global.css";

const router = getRouter();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

if (import.meta.env.PROD) {
  root.render(
    <ThemeProvider defaultTheme="system" storageKey="ohmyfs-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
} else {
  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="ohmyfs-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </React.StrictMode>
  );
}
