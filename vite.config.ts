import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client/public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:3000"
    }
  }
});
