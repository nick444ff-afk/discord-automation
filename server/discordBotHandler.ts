import * as db from "./db";

interface MessageWithButtons {
  id: string;
  channelId: string;
  content: string;
  components: ButtonComponent[];
}

interface ButtonComponent {
  customId: string;
  label: string;
  style: number;
}

// Simular clique em botões
export async function simulateButtonClick(
  instanceId: number,
  messageId: string,
  buttonCustomId: string,
  delay: number = 0
): Promise<{ success: boolean; message: string }> {
  try {
    if (delay > 0) {
      await new Promise(res => setTimeout(res, delay * 1000));
    }

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logMessage = `[${timestamp}] INFO  buttons      Botão clicado: ${buttonCustomId} (Mensagem: ${messageId})`;
    await db.addLog(instanceId, "INFO", logMessage);

    return { success: true, message: "Botão clicado com sucesso" };
  } catch (error: any) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    await db.addLog(instanceId, "ERROR", `[${timestamp}] ERROR buttons     Erro ao clicar botão: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Enviar mensagem em canal com delay
export async function sendMessageToChannel(
  instanceId: number,
  channelId: string,
  message: string,
  delay: number = 0,
  mention?: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (delay > 0) {
      await new Promise(res => setTimeout(res, delay * 1000));
    }

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let logContent = `[${timestamp}] INFO  messages     Mensagem enviada para #${channelId}`;
    
    if (mention) {
      logContent += ` - Menção: @${mention}`;
    }
    
    logContent += ` - Conteúdo: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`;
    
    await db.addLog(instanceId, "INFO", logContent);

    return { success: true, message: "Mensagem enviada com sucesso" };
  } catch (error: any) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    await db.addLog(instanceId, "ERROR", `[${timestamp}] ERROR messages    Erro ao enviar mensagem: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Enviar mensagem com delay customizado
export async function sendDelayedMessage(
  instanceId: number,
  channelId: string,
  message: string,
  delaySeconds: number
): Promise<{ success: boolean; message: string }> {
  try {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logMessage = `[${timestamp}] INFO  delay        Agendando mensagem com delay de ${delaySeconds}s para #${channelId}`;
    await db.addLog(instanceId, "INFO", logMessage);

    // Agendar envio
    setTimeout(async () => {
      await sendMessageToChannel(instanceId, channelId, message, 0);
    }, delaySeconds * 1000);

    return { success: true, message: `Mensagem agendada para ${delaySeconds}s` };
  } catch (error: any) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    await db.addLog(instanceId, "ERROR", `[${timestamp}] ERROR delay       Erro ao agendar mensagem: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Mencionar usuário em canal
export async function mentionUserInChannel(
  instanceId: number,
  channelId: string,
  userId: string,
  delaySeconds: number = 0
): Promise<{ success: boolean; message: string }> {
  try {
    if (delaySeconds > 0) {
      await new Promise(res => setTimeout(res, delaySeconds * 1000));
    }

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logMessage = `[${timestamp}] INFO  mentions     Usuário mencionado: <@${userId}> em #${channelId}`;
    await db.addLog(instanceId, "INFO", logMessage);

    return { success: true, message: "Usuário mencionado com sucesso" };
  } catch (error: any) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    await db.addLog(instanceId, "ERROR", `[${timestamp}] ERROR mentions    Erro ao mencionar usuário: ${error.message}`);
    return { success: false, message: error.message };
  }
}

// Confirmar fila automaticamente
export async function autoConfirmQueue(
  instanceId: number,
  channelId: string,
  messageId: string,
  confirmButtonCustomId: string,
  delaySeconds: number = 0
): Promise<{ success: boolean; message: string }> {
  try {
    if (delaySeconds > 0) {
      await new Promise(res => setTimeout(res, delaySeconds * 1000));
    }

    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logMessage = `[${timestamp}] SUCCESS confirmacao Fila confirmada automaticamente em #${channelId}`;
    await db.addLog(instanceId, "SUCCESS", logMessage);

    return { success: true, message: "Fila confirmada com sucesso" };
  } catch (error: any) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    await db.addLog(instanceId, "ERROR", `[${timestamp}] ERROR confirmacao Erro ao confirmar fila: ${error.message}`);
    return { success: false, message: error.message };
  }
}
