import { Client, Message } from 'discord.js-selfbot-v13';
import * as db from "./db";
import { organizations } from "../client/src/config/organizations";

export async function handleAutomation(client: Client, message: Message, settings: any, instanceId: number) {
  // 1. Filtro de Orgs Selecionadas
  let selectedOrgsNames = settings.selectedOrgs || [];
  if (typeof selectedOrgsNames === 'string') {
    try { selectedOrgsNames = JSON.parse(selectedOrgsNames); } catch (e) { selectedOrgsNames = []; }
  }
  
  // Normalizar nomes das orgs selecionadas
  const normalizedSelectedOrgs = selectedOrgsNames.map((n: string) => n.toLowerCase());
  
  const filteredOrgs = Object.entries(organizations)
    .filter(([name]) => normalizedSelectedOrgs.includes(name.toLowerCase()));

  const matchedOrgEntry = filteredOrgs.find(([_, org]) => org.guildId === message.guild?.id);
  if (!matchedOrgEntry) return;

  // 2. Filtro de Categoria (Pai do Canal)
  const channel = message.channel as any;
  const categoryName = channel.parent?.name?.toLowerCase() || "";
  const targetCategory = (settings.category || "Mobile").toLowerCase();

  if (!categoryName.includes(targetCategory)) return;

  // 3. Filtro de Modos (Nome do Canal)
  const channelName = channel.name?.toLowerCase() || "";
  const selectedModes = settings.selectedModes || ['1x1', '2x2', '3x3', '4x4'];
  const matchedMode = selectedModes.find((mode: string) => channelName.includes(mode.toLowerCase()));
  
  if (!matchedMode) return;

  try {
    // 4. Procurar Botões na mensagem recebida ou em mensagens recentes
    // Verificamos a mensagem atual e as últimas 3 para garantir que não perdemos o botão
    const msgs = await channel.messages.fetch({ limit: 3 });
    const targetMsg = msgs.find((m: any) => m.components?.some((row: any) => row.components.some((c: any) => c.type === 'BUTTON')));
    
    if (!targetMsg) return;

    const timestamp = new Date().toLocaleTimeString();

    for (const row of targetMsg.components) {
      for (const component of row.components) {
        if (component.type === 'BUTTON') {
          // Evitar botões de cancelamento/fechamento
          const label = (component.label || "").toLowerCase();
          if (["cancelar", "finalizar", "recusar", "fechar", "sair"].some(word => label.includes(word))) {
            continue;
          }

          try {
            // Delay configurado
            const delay = (settings.delaySeconds || 12) * 1000;
            await new Promise(res => setTimeout(res, delay));
            
            await targetMsg.clickButton(component.customId);
            
            const logMsg = `[${timestamp}] SUCCESS Botão "${component.label || 'Entrar'}" clicado em #${channel.name}`;
            console.log(logMsg);
            await db.addLog(instanceId, "SUCCESS", logMsg).catch(() => {});

            // 5. Mandar Mensagem Programada (após o clique)
            if (settings.mainMessage) {
                // Pequeno delay após o clique para enviar a mensagem
                await new Promise(res => setTimeout(res, 2000));
                
                // O usuário mencionou que o envio deve ser feito onde as filas aparecem
                // Por padrão enviamos no canal onde o botão foi clicado
                await channel.send(settings.mainMessage).catch(console.error);
                
                if (settings.secondaryMessage) {
                    await new Promise(res => setTimeout(res, 1000));
                    await channel.send(settings.secondaryMessage).catch(console.error);
                }
                
                const msgLog = `[${timestamp}] SUCCESS Mensagem enviada em #${channel.name}`;
                await db.addLog(instanceId, "SUCCESS", msgLog).catch(() => {});
                
                // Incrementar estatísticas
                await db.updateStatistics(instanceId, { entries: 1 }).catch(() => {});
            }

            return; // Clicou em um botão, encerra para esta mensagem
          } catch (err: any) {
            console.error("Erro ao clicar no botão:", err.message);
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
