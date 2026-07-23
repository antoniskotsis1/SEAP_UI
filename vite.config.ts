import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/seapp/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["react-aria-components", "react-hot-toast"],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      // SEAPP backend context path (server.servlet.context-path).
      "/seappi": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
