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

export async function startBotInstance(instanceId: number, botName: string = "BOT1") {
  try {
    // Tentar pegar configurações locais primeiro (mais rápido e seguro)
    let settings = await getSettings(botName);
    
    // Se não tiver local, tenta no banco
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
      return { status: "error", message: "Configuração ou tokens não encontrados. Salve primeiro!" };
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
        const timestamp = new Date().toLocaleTimeString();
        const logMsg = `[${timestamp}] SUCCESS Logado como @${client.user?.username}`;
        console.log(logMsg);
        await db.addLog(instanceId, "SUCCESS", logMsg).catch(() => {});
      });

      try {
        await client.login(token.trim());
        clients.push(client);
      } catch (err: any) {
        const timestamp = new Date().toLocaleTimeString();
        const errorMsg = `[${timestamp}] ERROR Falha no token: ${err.message}`;
        console.error(errorMsg);
        await db.addLog(instanceId, "ERROR", errorMsg).catch(() => {});
      }
    }

    if (clients.length === 0) {
      return { status: "error", message: "Nenhum token válido conseguiu logar." };
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

    await db.updateInstanceStatus(instanceId, "online").catch(() => {});
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
    await db.updateInstanceStatus(instanceId, "offline").catch(() => {});
    const timestamp = new Date().toLocaleTimeString();
    await db.addLog(instanceId, "INFO", `[${timestamp}] INFO Instância parada`).catch(() => {});
    return { status: "success", message: "Bot parado" };
  }
  return { status: "error", message: "Bot não está rodando" };
}

export function getBotInstanceStatus(instanceId: number) {
  const instance = botInstances.get(instanceId);
  return {
    isRunning: instance?.isRunning || false,
    uptime: instance?.uptimeSeconds || 0
  };
}
