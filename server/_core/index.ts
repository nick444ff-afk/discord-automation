import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter, registerBotApi } from "../routers";
import { createContext } from "./context";
import { setupVite } from "./vite";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerBotApi(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // No Railway, o build coloca os arquivos em dist/public
    // O arquivo index.js fica em dist/index.js
    // Então o caminho relativo de dist/index.js para dist/public é ./public
    const distPath = path.resolve(__dirname, "public");
    console.log("Serving static files from:", distPath);
    app.use(express.static(distPath));
    app.use("*", (req, res) => {
        if (req.originalUrl.startsWith("/api")) return res.status(404).end();
        res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);
