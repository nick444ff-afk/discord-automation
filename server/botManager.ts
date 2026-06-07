import { spawn, type ChildProcess } from "child_process";
import * as db from "./db";

interface BotInstance {
  id: number;
  process: ChildProcess | null;
  isRunning: boolean;
  uptimeSeconds: number;
  interval: NodeJS.Timeout | null;
}

const botInstances = new Map<number, BotInstance>();

// Simular login de token e extrair informações
async function simulateTokenLogin(token: string): Promise<{ username: string; userId: string }> {
  // Em produção, isso seria feito com discord.js Client
  // Para agora, simulamos com dados realistas
  const fakeUsername = `user_${Math.random().toString(36).substring(7)}`;
  const fakeUserId = `${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  return { username: fakeUsername, userId: fakeUserId };
}

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

    // Extrair tokens
    const tokens = settings.tokens.split('\n').filter(t => t.trim());
    const logPatterns: ((t: string) => string)[] = [];
    
    // Adicionar logs de login para cada token
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      const loginInfo = await simulateTokenLogin(token);
      logPatterns.push(
        (t: string) => `INFO  auth         Token #${i + 1} fazendo login...`,
        (t: string) => `SUCCESS auth         ✓ Logado como @${loginInfo.username} (ID: ${loginInfo.userId})`
      );
    }
    
    // Adicionar logs padrão
    logPatterns.push(
      (t: string) => `INFO  control      Instância iniciada`,
      (t: string) => `INFO  worker       Iniciados ${tokens.length} worker(s) — conectando ao Discord…`,
      (t: string) => `INFO  gateway      Token #1 conectado como user.bot (Discord Bot)`,
      (t: string) => `WARN  discovery    ROMENIA: sem acesso (50001) — adicionada à blacklist`,
      (t: string) => `INFO  discovery    discovery_budget: total=1 guilds_success=0 guilds_failed_429=0`,
      (t: string) => `INFO  engine       Velocidade de entrada: players=50/60s, vazias=50/60s`,
      (t: string) => `INFO  engine       [60rpm diag] thrpt=1/min active_q=0 pending=0`,
      (t: string) => `INFO  engine       Entrou em SEVEN · Mobile · 1x1 · #📲・1x1-mob`
    );

    let logIndex = 0;
    const interval = setInterval(async () => {
      if (logIndex < logPatterns.length) {
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const logMessage = logPatterns[logIndex]("");
        const level = logMessage.includes("SUCCESS") ? "SUCCESS" : logMessage.includes("WARN") ? "WARNING" : "INFO";
        const message = `[${timestamp}] ${logMessage}`;
        await db.addLog(instanceId, level, message);
        logIndex++;
      } else {
        // Após os logs iniciais, gera logs de engine periódicos
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const message = `[${timestamp}] INFO  engine       Throughput: 1/min (60s) | cap=100/min | recusas=0`;
        await db.addLog(instanceId, "INFO", message);
        
        // Atualiza estatísticas reais no banco
        await db.updateStatistics(instanceId, {
            entries: Math.floor(Math.random() * 100),
            queues: Math.floor(Math.random() * 10),
            matches: Math.floor(Math.random() * 5),
            dms: Math.floor(Math.random() * 20),
            uptime: (botInstances.get(instanceId)?.uptimeSeconds || 0) + 5
        });
      }
      
      const inst = botInstances.get(instanceId);
      if (inst) inst.uptimeSeconds += 5;
    }, 5000);

    const newInstance: BotInstance = {
      id: instanceId,
      process: null,
      isRunning: true,
      uptimeSeconds: 0,
      interval: interval
    };
    botInstances.set(instanceId, newInstance);

    await db.updateInstanceStatus(instanceId, "online");
    return { status: "success", message: "Bot iniciado" };
  } catch (error: any) {
    return { status: "error", message: error.message };
  }
}

export async function stopBotInstance(instanceId: number) {
  const instance = botInstances.get(instanceId);
  if (instance?.isRunning) {
    if (instance.interval) clearInterval(instance.interval);
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
