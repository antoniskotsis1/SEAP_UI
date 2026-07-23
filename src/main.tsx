import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Activate in-browser mock API for demo (remove for production).
// Loaded as a separate chunk so the ~50 kB of demo data stays out of the
// main entry bundle; awaited so the fetch interceptor is installed before
// the app renders and issues its first request.
async function bootstrap() {
  const { setupMockApi } = await import("./lib/mock-data");
  setupMockApi();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
