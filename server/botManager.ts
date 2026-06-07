import { Client } from 'discord.js-selfbot-v13';
import * as db from "./db";
import { getSettings } from "./localSettings";

interface BotInstance {
  id: number;
  client: Client;
  isRunning: boolean;
  uptimeSeconds: number;
  interval: NodeJS.Timeout | null;
}

const botInstances = new Map<number, BotInstance>();

// Memória temporária para logs e status (VELOCIDADE MÁXIMA)
export const memoryLogs = new Map<number, any[]>();
export const memoryStatus = new Map<number, boolean>();

function addMemoryLog(instanceId: number, level: string, message: string) {
    const logs = memoryLogs.get(instanceId) || [];
    logs.unshift({
        level,
        message,
        createdAt: new Date().toISOString()
    });
    memoryLogs.set(instanceId, logs.slice(0, 50));
}

export async function startBotInstance(instanceId: number, botName: string = "BOT1") {
  try {
    // Feedback imediato
    memoryStatus.set(instanceId, true);
    addMemoryLog(instanceId, "INFO", "Iniciando login do token...");

    let settings = await getSettings(botName);
    if (!settings) {
        try {
            const dbSettings = await db.getInstanceSettings(instanceId);
            if (dbSettings) {
                settings = {
                    tokens: dbSettings.tokens,
                    rotationMinutes: dbSettings.rotationMinutes,
                    delaySeconds: dbSettings.delaySeconds,
                    mainMessage: dbSettings.mainMessage,
                    category: dbSettings.category
                };
            }
        } catch (e) {}
    }

    if (!settings || !settings.tokens) {
      memoryStatus.set(instanceId, false);
      return { status: "error", message: "Token não encontrado." };
    }

    // PEGAR APENAS O PRIMEIRO TOKEN (Limitação de 1 token por instância)
    const token = settings.tokens.split(/[\n,]+/)[0]?.trim();

    if (!token) {
      memoryStatus.set(instanceId, false);
      return { status: "error", message: "Token inválido." };
    }

    let instance = botInstances.get(instanceId);
    if (instance?.isRunning) {
      return { status: "error", message: "Bot já está rodando" };
    }

    const client = new Client({ checkUpdate: false });
    
    return new Promise<{status: string, message: string}>((resolve) => {
      client.on('ready', async () => {
        const logMsg = `✓ Logado como @${client.user?.username}`;
        addMemoryLog(instanceId, "SUCCESS", logMsg);
        db.addLog(instanceId, "SUCCESS", logMsg).catch(() => {});
        
        const interval = setInterval(() => {
          const inst = botInstances.get(instanceId);
          if (inst) {
            inst.uptimeSeconds += 5;
            db.updateStatistics(instanceId, { uptime: inst.uptimeSeconds }).catch(() => {});
          }
        }, 5000);

        botInstances.set(instanceId, {
          id: instanceId,
          client: client,
          isRunning: true,
          uptimeSeconds: 0,
          interval: interval
        });

        db.updateInstanceStatus(instanceId, "online").catch(() => {});
        resolve({ status: "success", message: `Bot iniciado como @${client.user?.username}` });
      });

      client.login(token).catch((err) => {
        const errorMsg = `✕ Falha no login: ${err.message}`;
        addMemoryLog(instanceId, "ERROR", errorMsg);
        memoryStatus.set(instanceId, false);
        resolve({ status: "error", message: err.message });
      });

      // Timeout de segurança
      setTimeout(() => {
          if (!botInstances.has(instanceId)) {
              memoryStatus.set(instanceId, false);
              resolve({ status: "error", message: "Tempo de login excedido" });
          }
      }, 20000);
    });

  } catch (error: any) {
    memoryStatus.set(instanceId, false);
    return { status: "error", message: error.message };
  }
}

export async function stopBotInstance(instanceId: number) {
  const instance = botInstances.get(instanceId);
  memoryStatus.set(instanceId, false);
  
  if (instance) {
    if (instance.interval) clearInterval(instance.interval);
    try { instance.client.destroy(); } catch (e) {}
    botInstances.delete(instanceId);
  }
  
  addMemoryLog(instanceId, "INFO", "Bot parado.");
  db.updateInstanceStatus(instanceId, "offline").catch(() => {});
  return { status: "success", message: "Bot parado" };
}

export function getBotInstanceStatus(instanceId: number) {
  return {
    isRunning: memoryStatus.get(instanceId) || false,
    uptime: botInstances.get(instanceId)?.uptimeSeconds || 0
  };
}
