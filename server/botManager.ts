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

// Memória temporária para logs e status (ESTADOS: 'offline', 'authenticating', 'scanning', 'running')
export const memoryLogs = new Map<number, any[]>();
export const botState = new Map<number, 'offline' | 'authenticating' | 'scanning' | 'running'>();

function addMemoryLog(instanceId: number, level: string, message: string) {
    const logs = memoryLogs.get(instanceId) || [];
    logs.unshift({
        level,
        message,
        createdAt: new Date().toISOString()
    });
    memoryLogs.set(instanceId, logs.slice(0, 100)); // Aumentado para 100 logs
}

async function scanDiscordData(client: Client, instanceId: number) {
    try {
        botState.set(instanceId, 'scanning');
        addMemoryLog(instanceId, "INFO", "🔍 Iniciando busca de servidores...");
        
        const guilds = await client.guilds.fetch();
        addMemoryLog(instanceId, "INFO", `📊 Quantidade de servidores encontrados: ${guilds.size}`);

        if (guilds.size === 0) {
            addMemoryLog(instanceId, "WARNING", "⚠️ A conta não está em nenhum servidor.");
            return;
        }

        for (const [guildId, baseGuild] of guilds) {
            try {
                const guild = await baseGuild.fetch();
                addMemoryLog(instanceId, "SUCCESS", `🏢 Servidor: ${guild.name}`);

                const channels = await guild.channels.fetch();
                
                // Categorias
                const categories = channels.filter(c => c.type === 'GUILD_CATEGORY');
                if (categories.size > 0) {
                    addMemoryLog(instanceId, "INFO", `  📁 Categorias (${categories.size}): ${categories.map(c => c.name).join(', ')}`);
                } else {
                    addMemoryLog(instanceId, "INFO", "  📁 Nenhuma categoria encontrada neste servidor.");
                }

                // Canais de Texto
                const textChannels = channels.filter(c => c.type === 'GUILD_TEXT');
                if (textChannels.size > 0) {
                    addMemoryLog(instanceId, "INFO", `  💬 Canais de Texto (${textChannels.size}): ${textChannels.map(c => c.name).join(', ')}`);
                } else {
                    addMemoryLog(instanceId, "INFO", "  💬 Nenhum canal de texto encontrado.");
                }

                // Tópicos (Threads)
                const threads = await guild.channels.fetchActiveThreads();
                if (threads.threads.size > 0) {
                    addMemoryLog(instanceId, "INFO", `  🧵 Tópicos Ativos (${threads.threads.size}): ${threads.threads.map(t => t.name).join(', ')}`);
                } else {
                    addMemoryLog(instanceId, "INFO", "  🧵 Nenhum tópico ativo encontrado.");
                }

            } catch (guildErr: any) {
                addMemoryLog(instanceId, "ERROR", `❌ Erro ao escanear servidor ${guildId}: ${guildErr.message}`);
            }
        }

        addMemoryLog(instanceId, "SUCCESS", "✅ Escaneamento concluído com sucesso!");
        botState.set(instanceId, 'running');
    } catch (err: any) {
        addMemoryLog(instanceId, "ERROR", `❌ Erro crítico no escaneamento: ${err.message}`);
        botState.set(instanceId, 'running'); // Continua rodando mesmo se o scan falhar
    }
}

export async function startBotInstance(instanceId: number, botName: string) {
  try {
    botState.set(instanceId, 'authenticating');
    addMemoryLog(instanceId, "INFO", `🚀 Início da autenticação para ${botName}...`);

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

    if (!settings || !settings.tokens || settings.tokens.trim() === "") {
      botState.set(instanceId, 'offline');
      addMemoryLog(instanceId, "ERROR", "❌ Nenhum token configurado para este bot.");
      return { status: "error", message: "Token não encontrado." };
    }

    const token = settings.tokens.split(/[\n,]+/)[0]?.trim();
    if (!token) {
      botState.set(instanceId, 'offline');
      addMemoryLog(instanceId, "ERROR", "❌ Token inválido.");
      return { status: "error", message: "Token inválido." };
    }

    let existingInstance = botInstances.get(instanceId);
    if (existingInstance?.isRunning) {
        return { status: "error", message: "Este bot já está rodando." };
    }

    const client = new Client({ checkUpdate: false });
    
    return new Promise<{status: string, message: string}>((resolve) => {
      client.on('ready', async () => {
        addMemoryLog(instanceId, "SUCCESS", "🔑 Token validado com sucesso!");
        addMemoryLog(instanceId, "SUCCESS", `👤 Logado como @${client.user?.username}`);
        
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
        
        // Iniciar escaneamento
        scanDiscordData(client, instanceId).catch(console.error);
        
        resolve({ status: "success", message: `Bot iniciado com sucesso!` });
      });

      client.login(token).catch((err) => {
        const errorMsg = `❌ Falha na API do Discord: ${err.message}`;
        addMemoryLog(instanceId, "ERROR", errorMsg);
        botState.set(instanceId, 'offline');
        resolve({ status: "error", message: err.message });
      });

      // Timeout de 30 segundos removido a pedido do usuário
    });

  } catch (error: any) {
    botState.set(instanceId, 'offline');
    addMemoryLog(instanceId, "ERROR", `❌ Erro inesperado: ${error.message}`);
    return { status: "error", message: error.message };
  }
}

export async function stopBotInstance(instanceId: number) {
  const instance = botInstances.get(instanceId);
  botState.set(instanceId, 'offline');
  
  if (instance) {
    if (instance.interval) clearInterval(instance.interval);
    try { instance.client.destroy(); } catch (e) {}
    botInstances.delete(instanceId);
  }
  
  addMemoryLog(instanceId, "INFO", "🛑 Bot parado pelo usuário.");
  db.updateInstanceStatus(instanceId, "offline").catch(() => {});
  return { status: "success", message: "Bot parado" };
}

export function getBotInstanceStatus(instanceId: number) {
  const state = botState.get(instanceId) || 'offline';
  const instance = botInstances.get(instanceId);
  return {
    state,
    isRunning: state !== 'offline',
    uptime: instance?.uptimeSeconds || 0
  };
}
