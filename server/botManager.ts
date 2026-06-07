import { spawn, type ChildProcess } from "child_process";
import * as db from "./db";

interface BotInstance {
  id: number;
  process: ChildProcess | null;
  processId: number | null;
  isRunning: boolean;
  startTime: Date | null;
  uptimeSeconds: number;
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

    // Aqui conectamos com a sua automação real. 
    // Por enquanto, simulamos o processo do bot usando os tokens configurados.
    const mockProcess = spawn("node", ["-e", `console.log("Iniciando bot com tokens..."); setInterval(() => {}, 1000)`]);
    
    const newInstance: BotInstance = {
      id: instanceId,
      process: mockProcess,
      processId: mockProcess.pid || null,
      isRunning: true,
      startTime: new Date(),
      uptimeSeconds: 0
    };
    botInstances.set(instanceId, newInstance);

    await db.updateInstanceStatus(instanceId, "online");
    await db.addLog(instanceId, "SUCCESS", `✅ Bot iniciado com sucesso usando ${settings.tokens.split("\n").length} tokens.`);

    mockProcess.on("exit", () => {
      newInstance.isRunning = false;
      db.updateInstanceStatus(instanceId, "offline");
    });

    return { status: "success", message: "Bot iniciado" };
  } catch (error: any) {
    return { status: "error", message: error.message };
  }
}

export async function stopBotInstance(instanceId: number) {
  const instance = botInstances.get(instanceId);
  if (instance?.process) {
    instance.process.kill();
    instance.isRunning = false;
    await db.updateInstanceStatus(instanceId, "offline");
    await db.addLog(instanceId, "INFO", "Bot desligado pelo usuário.");
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
