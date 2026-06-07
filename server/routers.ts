import { systemRouter } from "./_core/systemRouter";
import { instancesRouter } from "./_core/instancesRouter";
import { settingsRouter } from "./_core/settingsRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as botManager from "./botManager";
import express from "express";
import { saveSettings, getSettings } from "./localSettings";

const DEFAULT_USER = { id: 1, name: "Admin" };

export const appRouter = router({
  system: systemRouter,
  instances: instancesRouter,
  settings: settingsRouter,
});

export function registerBotApi(app: express.Express) {
  // GET Status
  app.get("/api/bot/status/:name", async (req, res) => {
    try {
      const instances = await db.getUserInstances(DEFAULT_USER.id);
      let instance = instances.find(i => i.name.replace(/\s+/g, "") === req.params.name);
      if (!instance) {
        instance = await db.createInstance(DEFAULT_USER.id, req.params.name === "BOT1" ? "BOT 1" : "BOT 2");
      }
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
        stats: stats ? { ...stats, uptime: formatUptime(stats.uptime) } : { entries:0, queues:0, matches:0, dms:0, uptime: "00:00:00" }
      });
    } catch (e) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET Config
  app.get("/api/bot/config/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      // Tentar ler do arquivo local primeiro
      const localSettings = await getSettings(botName);
      if (localSettings) {
        return res.json({
          tokens: localSettings.tokens,
          rotation: localSettings.rotationMinutes,
          category: localSettings.category,
          mensagem: localSettings.mainMessage
        });
      }

      // Fallback para o DB
      const instances = await db.getUserInstances(DEFAULT_USER.id);
      const instance = instances.find(i => i.name.replace(/\s+/g, "") === botName);
      if (!instance) return res.json({ tokens: "", rotation: 90, category: "Mobile", mensagem: "" });
      const settings = await db.getInstanceSettings(instance.id);
      res.json({
        tokens: settings?.tokens || "",
        rotation: settings?.rotationMinutes || 90,
        category: settings?.category || "Mobile",
        mensagem: settings?.mainMessage || ""
      });
    } catch (e) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // POST Config
  app.post("/api/bot/config/:name", async (req, res) => {
    try {
      const { tokens, rotation, category, mensagem } = req.body;
      const botName = req.params.name;
      
      if (!tokens || tokens.trim() === "") {
        return res.status(400).json({ success: false, message: "Tokens são obrigatórios" });
      }
      
      // Salvar em arquivo local para garantir que funcione sem DB
      const settings = {
        tokens: tokens || "",
        rotationMinutes: parseInt(rotation) || 90,
        delaySeconds: 12,
        mainMessage: mensagem || "",
        category: category || "Mobile"
      };
      
      await saveSettings(botName, settings);

      // Tentar salvar no DB também, mas não falhar se der erro
      try {
        const instances = await db.getUserInstances(DEFAULT_USER.id);
        let instance = instances.find(i => i.name.replace(/\s+/g, "") === botName);
        if (!instance) {
          instance = await db.createInstance(DEFAULT_USER.id, botName === "BOT1" ? "BOT 1" : "BOT 2");
        }
        if (instance) {
          await db.createOrUpdateInstanceSettings(instance.id, {
            instanceId: instance.id,
            ...settings
          });
          // Adicionar log de sucesso no sistema de logs
          await db.addLog(instance.id, 'SUCCESS', `Configurações do ${botName} salvas com sucesso!`);
        }
      } catch (dbError) {
        console.warn("[Database] Failed to sync settings to DB, but saved to local file.");
      }

      console.log(`[Config] Settings for ${botName} saved successfully.`);
      res.json({ success: true, message: "Configurações salvas com sucesso!" });
    } catch (e: any) {
      console.error("Error saving config:", e.message, e.stack);
      res.status(500).json({ success: false, message: e.message || "Erro interno do servidor" });
    }
  });

  // START Bot
  app.post("/api/bot/start/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(/\s+/g, "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    const result = await botManager.startBotInstance(instance.id);
    res.json({ success: result.status === "success", message: result.message });
  });

  // STOP Bot
  app.post("/api/bot/stop/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(/\s+/g, "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    const result = await botManager.stopBotInstance(instance.id);
    res.json({ success: result.status === "success", message: result.message });
  });

  // GET Logs
  app.get("/api/bot/logs/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(/\s+/g, "") === req.params.name);
    if (!instance) return res.json([]);
    const logs = await db.getInstanceLogs(instance.id, 50);
    res.json(logs);
  });

  // DELETE Logs
  app.delete("/api/bot/logs/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(/\s+/g, "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    await db.clearInstanceLogs(instance.id);
    res.json({ success: true });
  });

  // RESET Stats
  app.post("/api/bot/reset/:name", async (req, res) => {
    const instances = await db.getUserInstances(DEFAULT_USER.id);
    const instance = instances.find(i => i.name.replace(/\s+/g, "") === req.params.name);
    if (!instance) return res.status(404).json({ error: "Not found" });
    await db.resetStatistics(instance.id);
    res.json({ success: true });
  });
}

export type AppRouter = typeof appRouter;
