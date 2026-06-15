import { Client, Message } from 'discord.js-selfbot-v13';
import * as db from "./db";
import { organizations } from "../client/src/config/organizations";

// Controle de processamento para evitar duplicidade
const processing = new Set<string>();

export async function handleAutomation(client: Client, message: Message, settings: any, instanceId: number) {
  const channel = message.channel as any;
  if (processing.has(channel.id)) return;

  // 1. Filtro de Orgs Selecionadas
  let selectedOrgsNames = settings.selectedOrgs || [];
  if (typeof selectedOrgsNames === 'string') {
    try { selectedOrgsNames = JSON.parse(selectedOrgsNames); } catch (e) { selectedOrgsNames = []; }
  }
  
  const normalizedSelectedOrgs = selectedOrgsNames.map((n: string) => n.toLowerCase());
  const filteredOrgs = Object.entries(organizations)
    .filter(([name]) => normalizedSelectedOrgs.includes(name.toLowerCase()));

  const matchedOrgEntry = filteredOrgs.find(([_, org]) => org.guildId === message.guild?.id);
  if (!matchedOrgEntry) return;

  // 2. Filtro de Categoria (Pai do Canal)
  const categoryName = channel.parent?.name?.toLowerCase() || "";
  const targetCategory = (settings.category || "Mobile").toLowerCase();
  if (!categoryName.includes(targetCategory)) return;

  // 3. Filtro de Modos (Nome do Canal)
  const channelName = channel.name?.toLowerCase() || "";
  const selectedModes = settings.selectedModes || ['1x1', '2x2', '3x3', '4x4'];
  const matchedMode = selectedModes.find((mode: string) => channelName.includes(mode.toLowerCase()));
  if (!matchedMode) return;

  try {
    processing.add(channel.id);
    
    // 4. Buscar mensagens com botões
    const msgs = await channel.messages.fetch({ limit: 5 });
    const targetMsg = msgs.find((m: any) => m.components?.some((row: any) => row.components.some((c: any) => c.type === 'BUTTON')));
    
    if (!targetMsg) return;

    const timestamp = new Date().toLocaleTimeString();

    // Lógica de prioridade de botões baseada no tipo (Mobile/Emu/Tático)
    let buttonToClick = null;
    const format = matchedMode.toLowerCase(); // 1x1, 2x2, etc
    const type = targetCategory.toLowerCase(); // mobile, emulador, etc

    for (const row of targetMsg.components) {
      for (const component of row.components) {
        if (component.type === 'BUTTON') {
          const label = (component.label || "").toLowerCase();
          if (["cancelar", "finalizar", "recusar", "fechar", "sair"].some(word => label.includes(word))) continue;

          // Se for Tático, procura o subtipo no label
          if (type.includes("tático")) {
            if (label.includes("mobile") || label.includes("emulador")) {
               buttonToClick = component;
               break;
            }
          } 
          // Se for 1x1, procura Normal ou Infinito
          else if (format === "1x1") {
            if (label.includes("normal") || label.includes("infinito")) {
              buttonToClick = component;
              break;
            }
          }
          
          // Se não encontrou específico, pega o primeiro botão válido
          if (!buttonToClick) buttonToClick = component;
        }
      }
      if (buttonToClick) break;
    }

    if (buttonToClick) {
      try {
        // 1. DELAY VARIÁVEL PARA O CLIQUE (2 a 3 segundos para evitar detecção)
        const randomDelay = Math.floor(Math.random() * (3000 - 2000 + 1) + 2000);
        await new Promise(res => setTimeout(res, randomDelay));
        
        await targetMsg.clickButton(buttonToClick.customId);
        
        // LOGS DE SUCESSO NO PAINEL
        const logClique = `[${timestamp}] ✅ Botão "${buttonToClick.label || 'Entrar'}" clicado em #${channel.name}`;
        await db.addLog(instanceId, "SUCCESS", logClique).catch(() => {});
        console.log(logClique);

        // 2. DELAY PROGRAMADO ANTES DO ENVIO DA MENSAGEM (Ex: 12s)
        if (settings.mainMessage) {
            const delayMensagem = (settings.delaySeconds || 12) * 1000;
            console.log(`[${timestamp}] Aguardando delay de ${settings.delaySeconds}s para enviar a mensagem...`);
            await new Promise(res => setTimeout(res, delayMensagem));
            
            // Enviar mensagem SEM menções (conforme solicitado)
            await channel.send(settings.mainMessage).catch(console.error);
            
            const logMsg1 = `[${timestamp}] 📩 Mensagem enviada em #${channel.name}`;
            await db.addLog(instanceId, "SUCCESS", logMsg1).catch(() => {});

            if (settings.secondaryMessage) {
                await new Promise(res => setTimeout(res, 1000));
                await channel.send(settings.secondaryMessage).catch(console.error);
                const logMsg2 = `[${timestamp}] 📩 Mensagem secundária enviada em #${channel.name}`;
                await db.addLog(instanceId, "SUCCESS", logMsg2).catch(() => {});
            }
            
            // Incrementar estatísticas
            await db.updateStatistics(instanceId, { entries: 1, queues: 1 }).catch(() => {});
        }
      } catch (err: any) {
        const errorLog = `[${timestamp}] ❌ Erro ao clicar: ${err.message}`;
        await db.addLog(instanceId, "ERROR", errorLog).catch(() => {});
        console.error(errorLog);
      }
    }
  } catch (error: any) {
    console.error("Erro na automação:", error.message);
  } finally {
    // Liberar o canal após 5 segundos para permitir novas interações
    setTimeout(() => processing.delete(channel.id), 5000);
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
