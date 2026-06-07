import { spawn, ChildProcess } from "child_process";
import * as db from "./db";
import { emitLog, emitStats, emitInstanceStatus } from "./socketIO";

interface BotInstance {
  processId: number | null;
  process: ChildProcess | null;
  isRunning: boolean;
  startTime: Date | null;
  uptimeSeconds: number;
}

// In-memory store for bot instances
const botInstances: Map<number, BotInstance> = new Map();

/**
 * Initialize a bot instance (create entry in map if not exists)
 */
export function initializeBotInstance(instanceId: number): BotInstance {
  if (!botInstances.has(instanceId)) {
    botInstances.set(instanceId, {
      processId: null,
      process: null,
      isRunning: false,
      startTime: null,
      uptimeSeconds: 0,
    });
  }
  return botInstances.get(instanceId)!;
}

/**
 * Start a bot instance
 */
export async function startBotInstance(instanceId: number): Promise<{
  status: string;
  message: string;
  processId?: number;
}> {
  try {
    const instance = initializeBotInstance(instanceId);

    if (instance.isRunning) {
      return {
        status: "error",
        message: "Bot já está em execução",
      };
    }

    // Get instance details from database
    const dbInstance = await db.getInstanceById(instanceId);
    if (!dbInstance) {
      return {
        status: "error",
        message: "Instância não encontrada",
      };
    }

    // Simulate bot startup with a mock process
    // In production, this would spawn the actual Discord bot process
    const mockProcess = spawn("node", ["-e", "setInterval(() => {}, 1000)"]);

    instance.process = mockProcess;
    instance.processId = mockProcess.pid || null;
    instance.isRunning = true;
    instance.startTime = new Date();
    instance.uptimeSeconds = 0;

    // Update database
    await db.updateInstanceStatus(instanceId, "online");

    // Emit events
    emitLog(instanceId, "SUCCESS", `✅ Bot iniciado com sucesso (PID: ${instance.processId})`);
    emitInstanceStatus(instanceId, "online");

    // Handle process exit
    mockProcess.on("exit", async () => {
      instance.isRunning = false;
      instance.process = null;
      instance.processId = null;
      await db.updateInstanceStatus(instanceId, "offline");
      emitLog(instanceId, "WARNING", "⚠️ Bot foi encerrado");
      emitInstanceStatus(instanceId, "offline");
    });

    // Handle process errors
    mockProcess.on("error", async (error) => {
      console.error(`Bot process error (${instanceId}):`, error);
      instance.isRunning = false;
      instance.process = null;
      instance.processId = null;
      await db.updateInstanceStatus(instanceId, "error");
      emitLog(instanceId, "ERROR", `❌ Erro no processo: ${error.message}`);
      emitInstanceStatus(instanceId, "error");
    });

    // Simulate uptime tracking
    const uptimeInterval = setInterval(async () => {
      if (!instance.isRunning) {
        clearInterval(uptimeInterval);
        return;
      }

      instance.uptimeSeconds++;
      await db.updateInstanceUptime(instanceId, instance.uptimeSeconds);
      emitStats(instanceId, {
        uptime: instance.uptimeSeconds,
      });
    }, 1000);

    return {
      status: "success",
      message: "Bot iniciado com sucesso",
      processId: instance.processId || undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    emitLog(instanceId, "ERROR", `❌ Erro ao iniciar bot: ${errorMessage}`);
    return {
      status: "error",
      message: errorMessage,
    };
  }
}

/**
 * Stop a bot instance
 */
export async function stopBotInstance(instanceId: number): Promise<{
  status: string;
  message: string;
}> {
  try {
    const instance = botInstances.get(instanceId);

    if (!instance || !instance.isRunning) {
      return {
        status: "error",
        message: "Bot não está em execução",
      };
    }

    // Kill the process
    if (instance.process) {
      instance.process.kill("SIGTERM");

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (instance.process && !instance.process.killed) {
          instance.process.kill("SIGKILL");
        }
      }, 5000);
    }

    instance.isRunning = false;
    instance.process = null;
    instance.processId = null;

    // Update database
    await db.updateInstanceStatus(instanceId, "offline");

    // Emit events
    emitLog(instanceId, "INFO", "✅ Bot desligado com sucesso");
    emitInstanceStatus(instanceId, "offline");

    return {
      status: "success",
      message: "Bot desligado com sucesso",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    emitLog(instanceId, "ERROR", `❌ Erro ao desligar bot: ${errorMessage}`);
    return {
      status: "error",
      message: errorMessage,
    };
  }
}

/**
 * Restart a bot instance
 */
export async function restartBotInstance(instanceId: number): Promise<{
  status: string;
  message: string;
}> {
  try {
    await stopBotInstance(instanceId);
    // Wait a bit before restarting
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return startBotInstance(instanceId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      status: "error",
      message: errorMessage,
    };
  }
}

/**
 * Get bot instance status
 */
export function getBotInstanceStatus(instanceId: number): {
  isRunning: boolean;
  processId: number | null;
  uptime: number;
  startTime: Date | null;
} {
  const instance = botInstances.get(instanceId);
  if (!instance) {
    return {
      isRunning: false,
      processId: null,
      uptime: 0,
      startTime: null,
    };
  }

  return {
    isRunning: instance.isRunning,
    processId: instance.processId,
    uptime: instance.uptimeSeconds,
    startTime: instance.startTime,
  };
}

/**
 * Stop all bot instances (cleanup)
 */
export async function stopAllBotInstances(): Promise<void> {
  const promises = Array.from(botInstances.keys()).map((instanceId) =>
    stopBotInstance(instanceId).catch((error) => {
      console.error(`Error stopping bot instance ${instanceId}:`, error);
    })
  );

  await Promise.all(promises);
}
