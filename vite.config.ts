import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "client",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:3000"
    }
  }
});
