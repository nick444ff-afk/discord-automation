import { Client } from 'discord.js-selfbot-v13';
import * as db from "./db";
import { getSettings } from "./localSettings";

interface BotInstance {
  id: number;
  clients: Client[];
  isRunning: boolean;
  uptimeSeconds: number;
  interval: NodeJS.Timeout | null;
}

const botInstances = new Map<number, BotInstance>();

// Memória temporária para logs e status (ULTRA RÁPIDO)
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
    // Feedback imediato de que está tentando ligar
    memoryStatus.set(instanceId, true);
    addMemoryLog(instanceId, "INFO", "Iniciando processo de login...");

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
      return { status: "error", message: "Tokens não encontrados. Salve primeiro!" };
    }

    const tokens = settings.tokens.split(/[\n,]+/).filter(t => t.trim());
    const clients: Client[] = [];

    // Tentar logar todos os tokens em paralelo para ser mais rápido
    const loginPromises = tokens.map(async (token) => {
      const client = new Client({ checkUpdate: false });
      
      return new Promise<void>((resolve) => {
        client.on('ready', async () => {
          const logMsg = `✓ Logado como @${client.user?.username}`;
          addMemoryLog(instanceId, "SUCCESS", logMsg);
          db.addLog(instanceId, "SUCCESS", logMsg).catch(() => {});
          clients.push(client);
          resolve();
        });

        client.login(token.trim()).catch((err) => {
          const errorMsg = `✕ Falha no token: ${err.message}`;
          addMemoryLog(instanceId, "ERROR", errorMsg);
          resolve();
        });

        // Timeout de 15 segundos por token para não travar tudo
        setTimeout(resolve, 15000);
      });
    });

    await Promise.all(loginPromises);

    if (clients.length === 0) {
      memoryStatus.set(instanceId, false);
      return { status: "error", message: "Nenhum token conseguiu logar." };
    }

    const interval = setInterval(() => {
      const inst = botInstances.get(instanceId);
      if (inst) {
        inst.uptimeSeconds += 5;
        db.updateStatistics(instanceId, { uptime: inst.uptimeSeconds }).catch(() => {});
      }
    }, 5000);

    botInstances.set(instanceId, {
      id: instanceId,
      clients: clients,
      isRunning: true,
      uptimeSeconds: 0,
      interval: interval
    });

    db.updateInstanceStatus(instanceId, "online").catch(() => {});
    return { status: "success", message: `Bot iniciado com ${clients.length} conta(s).` };
  } catch (error: any) {
    memoryStatus.set(instanceId, false);
    return { status: "error", message: error.message };
  }
}

export async function stopBotInstance(instanceId: number) {
  const instance = botInstances.get(instanceId);
  memoryStatus.set(instanceId, false); // Status muda na hora
  
  if (instance) {
    if (instance.interval) clearInterval(instance.interval);
    instance.clients.forEach(c => { try { c.destroy(); } catch (e) {} });
    botInstances.delete(instanceId);
  }
  
  addMemoryLog(instanceId, "INFO", "Bot parado.");
  db.updateInstanceStatus(instanceId, "offline").catch(() => {});
  return { status: "success", message: "Bot parado" };
}

export function getBotInstanceStatus(instanceId: number) {
  const instance = botInstances.get(instanceId);
  return {
    isRunning: memoryStatus.get(instanceId) || false,
    uptime: instance?.uptimeSeconds || 0
  };
}
