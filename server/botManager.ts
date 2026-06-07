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

// Memória temporária para logs e status caso o banco falhe
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
      return { status: "error", message: "Tokens não encontrados. Salve primeiro!" };
    }

    let instance = botInstances.get(instanceId);
    if (instance?.isRunning) {
      return { status: "error", message: "Bot já está rodando" };
    }

    const tokens = settings.tokens.split(/[\n,]+/).filter(t => t.trim());
    const clients: Client[] = [];

    for (const token of tokens) {
      const client = new Client({ checkUpdate: false });

      client.on('ready', async () => {
        const logMsg = `✓ Logado como @${client.user?.username}`;
        console.log(logMsg);
        addMemoryLog(instanceId, "SUCCESS", logMsg);
        await db.addLog(instanceId, "SUCCESS", logMsg).catch(() => {});
      });

      try {
        await client.login(token.trim());
        clients.push(client);
      } catch (err: any) {
        const errorMsg = `✕ Falha no token: ${err.message}`;
        console.error(errorMsg);
        addMemoryLog(instanceId, "ERROR", errorMsg);
        await db.addLog(instanceId, "ERROR", errorMsg).catch(() => {});
      }
    }

    if (clients.length === 0) {
      return { status: "error", message: "Nenhum token conseguiu logar." };
    }

    const interval = setInterval(async () => {
      const inst = botInstances.get(instanceId);
      if (inst) {
        inst.uptimeSeconds += 5;
        await db.updateStatistics(instanceId, { uptime: inst.uptimeSeconds }).catch(() => {});
      }
    }, 5000);

    const newInstance: BotInstance = {
      id: instanceId,
      clients: clients,
      isRunning: true,
      uptimeSeconds: 0,
      interval: interval
    };
    botInstances.set(instanceId, newInstance);
    memoryStatus.set(instanceId, true);

    await db.updateInstanceStatus(instanceId, "online").catch(() => {});
    addMemoryLog(instanceId, "INFO", "Bot iniciado com sucesso.");
    
    return { status: "success", message: `Bot iniciado com ${clients.length} conta(s).` };
  } catch (error: any) {
    return { status: "error", message: error.message };
  }
}

export async function stopBotInstance(instanceId: number) {
  const instance = botInstances.get(instanceId);
  if (instance?.isRunning) {
    if (instance.interval) clearInterval(instance.interval);
    for (const client of instance.clients) {
      try { client.destroy(); } catch (err) {}
    }
    instance.isRunning = false;
    memoryStatus.set(instanceId, false);
    await db.updateInstanceStatus(instanceId, "offline").catch(() => {});
    addMemoryLog(instanceId, "INFO", "Bot parado pelo usuário.");
    return { status: "success", message: "Bot parado" };
  }
  return { status: "error", message: "Bot não está rodando" };
}

export function getBotInstanceStatus(instanceId: number) {
  const instance = botInstances.get(instanceId);
  const isRunning = instance?.isRunning || memoryStatus.get(instanceId) || false;
  return {
    isRunning: isRunning,
    uptime: instance?.uptimeSeconds || 0
  };
}
