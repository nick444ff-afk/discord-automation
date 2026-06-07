import { Client, Message } from 'discord.js-selfbot-v13';
import * as db from "./db";

// Esta função seria chamada dentro do botManager quando uma mensagem é recebida
export async function handleAutomation(client: Client, message: Message, settings: any, instanceId: number) {
  try {
    // 1. Verificar se é uma mensagem de interesse (ex: tem botões ou é de um canal específico)
    if (message.components.length > 0) {
      // Lógica de clique automático se configurado
      if (settings.delaySeconds > 0) {
        await new Promise(res => setTimeout(res, settings.delaySeconds * 1000));
      }
      
      // Tentar clicar no primeiro botão (exemplo)
      for (const row of message.components) {
        for (const component of row.components) {
          if (component.type === 'BUTTON') {
            try {
              await message.clickButton(component.customId);
              const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
              await db.addLog(instanceId, "SUCCESS", `[${timestamp}] SUCCESS buttons     Botão "${component.label}" clicado em #${message.channel.id}`);
              return;
            } catch (err) {}
          }
        }
      }
    }

    // 2. Envio de mensagem automática se configurado
    if (settings.mainMessage && !message.author.bot) {
       // Lógica de resposta ou envio periódico
    }

  } catch (error: any) {
    console.error("Erro na automação:", error);
  }
}

// Funções exportadas para o Router (usadas via Painel)
export async function realClickButton(client: Client, messageId: string, channelId: string, buttonId: string) {
  const channel = await client.channels.fetch(channelId);
  if (channel?.isText()) {
    const message = await channel.messages.fetch(messageId);
    await message.clickButton(buttonId);
    return true;
  }
  return false;
}

export async function realSendMessage(client: Client, channelId: string, content: string) {
  const channel = await client.channels.fetch(channelId);
  if (channel?.isText()) {
    await channel.send(content);
    return true;
  }
  return false;
}
