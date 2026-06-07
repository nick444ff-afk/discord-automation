import { systemRouter } from "./_core/systemRouter";
import { instancesRouter } from "./_core/instancesRouter";
import { settingsRouter } from "./_core/settingsRouter";
import { automationRouter } from "./_core/automationRouter";
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
  automation: automationRouter,
});

export function registerBotApi(app: express.Express) {
  // GET Status
  app.get("/api/bot/status/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      const instanceId = botName === "BOT1" ? 1 : 2;
      const status = botManager.getBotInstanceStatus(instanceId);
      
      let stats = null;
      try {
        stats = await db.getStatistics(instanceId);
      } catch (e) {}
      
      const formatUptime = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = seconds % 60;
          return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
      };

      res.json({
        isRunning: status.isRunning,
        stats: stats ? { ...stats, uptime: formatUptime(stats.uptime) } : { entries:0, queues:0, matches:0, dms:0, uptime: formatUptime(status.uptime) }
      });
    } catch (e) {
      res.json({ isRunning: false, stats: { entries:0, queues:0, matches:0, dms:0, uptime: "00:00:00" } });
    }
  });

  // GET Config
  app.get("/api/bot/config/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      const localSettings = await getSettings(botName);
      if (localSettings) {
        return res.json({
          tokens: localSettings.tokens,
          rotation: localSettings.rotationMinutes,
          category: localSettings.category,
          mensagem: localSettings.mainMessage
        });
      }
      res.json({ tokens: "", rotation: 90, category: "Mobile", mensagem: "" });
    } catch (e) {
      res.json({ tokens: "", rotation: 90, category: "Mobile", mensagem: "" });
    }
  });

  // POST Config
  app.post("/api/bot/config/:name", async (req, res) => {
    const { tokens, rotation, category, mensagem } = req.body;
    const botName = req.params.name;
    const instanceId = botName === "BOT1" ? 1 : 2;
    
    const settings = {
      tokens: tokens || "",
      rotationMinutes: parseInt(rotation) || 90,
      delaySeconds: 12,
      mainMessage: mensagem || "",
      category: category || "Mobile"
    };

    try {
      await saveSettings(botName, settings);
      
      // Sincronizar banco em background
      db.getUserInstances(DEFAULT_USER.id).then(async (instances) => {
        let instance = instances.find(i => i.name.replace(/\s+/g, "") === botName);
        if (!instance) {
          instance = await db.createInstance(DEFAULT_USER.id, botName === "BOT1" ? "BOT 1" : "BOT 2");
        }
        if (instance) {
          await db.createOrUpdateInstanceSettings(instance.id, {
            instanceId: instance.id,
            ...settings
          });
        }
      }).catch(() => {});

      res.json({ success: true, message: "Configuração salva!" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: "Erro ao salvar" });
    }
  });

  // START Bot
  app.post("/api/bot/start/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      const instanceId = botName === "BOT1" ? 1 : 2;
      const result = await botManager.startBotInstance(instanceId, botName);
      res.json({ success: result.status === "success", message: result.message });
    } catch (e: any) {
      res.json({ success: false, message: e.message });
    }
  });

  // STOP Bot
  app.post("/api/bot/stop/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      const instanceId = botName === "BOT1" ? 1 : 2;
      const result = await botManager.stopBotInstance(instanceId);
      res.json({ success: result.status === "success", message: result.message });
    } catch (e: any) {
      res.json({ success: false, message: e.message });
    }
  });

  // GET Logs
  app.get("/api/bot/logs/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      const instanceId = botName === "BOT1" ? 1 : 2;
      
      let logs: any[] = [];
      try {
        const dbLogs = await db.getInstanceLogs(instanceId, 50);
        const mLogs = botManager.memoryLogs.get(instanceId) || [];
        // Combinar logs do banco e da memória, remover duplicados por mensagem e data
        logs = [...mLogs, ...dbLogs].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 50);
      } catch (e) {
        logs = botManager.memoryLogs.get(instanceId) || [];
      }
      
      res.json(logs);
    } catch (e) {
      res.json([]);
    }
  });

  // DELETE Logs
  app.delete("/api/bot/logs/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      const instanceId = botName === "BOT1" ? 1 : 2;
      botManager.memoryLogs.set(instanceId, []);
      await db.clearInstanceLogs(instanceId).catch(() => {});
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false });
    }
  });

  // RESET Stats
  app.post("/api/bot/reset/:name", async (req, res) => {
    try {
      const botName = req.params.name;
      const instanceId = botName === "BOT1" ? 1 : 2;
      await db.resetStatistics(instanceId).catch(() => {});
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false });
    }
  });
}

export type AppRouter = typeof appRouter;
