import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as botManager from "./botManager";
import express from "express";

// Usuário padrão
const DEFAULT_USER = { id: 1, name: "Admin" };

export const appRouter = router({
  system: systemRouter,
});

export function registerBotApi(app: express.Express) {
  // Endpoints para o frontend estático
  app.get("/api/bot/status/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    const status = botManager.getBotInstanceStatus(instance.id);
    const stats = await db.getStatistics(instance.id);
    
    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    };

    res.json({
      isRunning: status.isRunning,
      stats: stats ? { ...stats, uptime: formatUptime(stats.uptime) } : null
    });
  });

  app.get("/api/bot/config/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    const settings = await db.getInstanceSettings(instance.id);
    res.json({
      tokens: settings?.tokens || "",
      rotation: settings?.rotationMinutes || 90,
      category: settings?.category || "Mobile",
      mensagem: settings?.mainMessage || ""
    });
  });

  app.post("/api/bot/config/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    let instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) {
        instance = await db.createInstance(DEFAULT_USER.id, req.params.name === "BOT1" ? "BOT 1" : "BOT 2");
    }
    const { tokens, rotation, category, mensagem } = req.body;
    await db.createOrUpdateInstanceSettings(instance.id, {
      instanceId: instance.id,
      tokens,
      tokenRotation: true,
      rotationMinutes: parseInt(rotation),
      category,
      mainMessage: mensagem,
      secondaryMessage: "",
      delaySeconds: 12,
      organizations: "{}",
      queueMode: "2x2"
    });
    res.json({ success: true });
  });

  app.post("/api/bot/start/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    const result = await botManager.startBotInstance(instance.id);
    res.json({ success: result.status === "success", message: result.message });
  });

  app.post("/api/bot/stop/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    const result = await botManager.stopBotInstance(instance.id);
    res.json({ success: result.status === "success", message: result.message });
  });

  app.get("/api/bot/logs/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    const logs = await db.getInstanceLogs(instance.id, 50);
    res.json(logs);
  });

  app.delete("/api/bot/logs/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    await db.clearInstanceLogs(instance.id);
    res.json({ success: true });
  });

  app.post("/api/bot/reset/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(" ", "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    await db.resetStatistics(instance.id);
    res.json({ success: true });
  });
}

export type AppRouter = typeof appRouter;
