import { Client, Message } from 'discord.js-selfbot-v13';
import * as db from "./db";

export async function handleAutomation(client: Client, message: Message, settings: any, instanceId: number) {
  try {
    // Lógica simplificada de automação para garantir que o bot não crash
    if (message.components && message.components.length > 0) {
      const timestamp = new Date().toLocaleTimeString();
      
      for (const row of message.components) {
        for (const component of row.components) {
          if (component.type === 'BUTTON') {
            try {
              // Simular um delay humano se configurado
              const delay = (settings.delaySeconds || 5) * 1000;
              await new Promise(res => setTimeout(res, delay));
              
              await message.clickButton(component.customId);
              const logMsg = `[${timestamp}] SUCCESS Botão "${component.label || 'Desconhecido'}" clicado.`;
              console.log(logMsg);
              await db.addLog(instanceId, "SUCCESS", logMsg).catch(() => {});
              return;
            } catch (err: any) {
              console.error("Erro ao clicar no botão:", err.message);
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Erro na automação:", error.message);
  }
}

export async function realSendMessage(client: Client, channelId: string, content: string) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && 'send' in channel) {
      await (channel as any).send(content);
      return true;
    }
  } catch (e) {
    console.error("Erro ao enviar mensagem:", e);
  }
  return false;
}
