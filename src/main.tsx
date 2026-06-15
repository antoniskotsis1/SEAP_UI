import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupMockApi } from "./lib/mock-data";

// Activate in-browser mock API for demo (remove for production)
setupMockApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
