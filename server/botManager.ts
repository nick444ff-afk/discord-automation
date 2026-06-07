import { Client } from 'discord.js-selfbot-v13';
import * as db from "./db";

interface BotInstance {
  id: number;
  clients: Client[];
  isRunning: boolean;
  uptimeSeconds: number;
  interval: NodeJS.Timeout | null;
}

const botInstances = new Map<number, BotInstance>();

export async function startBotInstance(instanceId: number) {
  try {
    const settings = await db.getInstanceSettings(instanceId);
    if (!settings || !settings.tokens) {
      return { status: "error", message: "Configuração ou tokens não encontrados. Salve primeiro!" };
    }

    let instance = botInstances.get(instanceId);
    if (instance?.isRunning) {
      return { status: "error", message: "Bot já está rodando" };
    }

    const tokens = settings.tokens.split('\n').filter(t => t.trim());
    const clients: Client[] = [];

    for (const token of tokens) {
      const client = new Client({
        checkUpdate: false,
      });

      client.on('ready', async () => {
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const logMsg = `[${timestamp}] SUCCESS auth         ✓ Logado como @${client.user?.username} (ID: ${client.user?.id})`;
        await db.addLog(instanceId, "SUCCESS", logMsg);
        console.log(logMsg);
      });

      client.on('messageCreate', async (message) => {
        try {
          const currentSettings = await db.getInstanceSettings(instanceId);
          if (currentSettings) {
            // Importar dinamicamente para evitar circular dependency se necessário
            const { handleAutomation } = require("./discordBotHandler");
            await handleAutomation(client, message, currentSettings, instanceId);
          }
        } catch (err) {
          console.error("Erro no listener de mensagens:", err);
        }
      });

      try {
        await client.login(token.trim());
        clients.push(client);
      } catch (err: any) {
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        await db.addLog(instanceId, "ERROR", `[${timestamp}] ERROR auth         Erro ao logar token: ${err.message}`);
      }
    }

    if (clients.length === 0) {
      return { status: "error", message: "Nenhum token válido conseguiu logar." };
    }

    const interval = setInterval(async () => {
      const inst = botInstances.get(instanceId);
      if (inst) {
        inst.uptimeSeconds += 5;
        // Atualiza estatísticas reais no banco
        await db.updateStatistics(instanceId, {
            uptime: inst.uptimeSeconds
        });
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

    await db.updateInstanceStatus(instanceId, "online");
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
      try {
        client.destroy();
      } catch (err) {}
    }
    
    instance.isRunning = false;
    await db.updateInstanceStatus(instanceId, "offline");
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    await db.addLog(instanceId, "INFO", `[${timestamp}] INFO  control      Instância parada pelo usuário`);
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
