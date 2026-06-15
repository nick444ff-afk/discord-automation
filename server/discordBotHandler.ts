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
        // DELAY DO CLIQUE (Respeitando o delay programado no painel)
        const delayMs = (settings.delaySeconds || 12) * 1000;
        console.log(`[${timestamp}] Aguardando delay de ${settings.delaySeconds}s para clicar...`);
        await new Promise(res => setTimeout(res, delayMs));
        
        await targetMsg.clickButton(buttonToClick.customId);
        
        // LOGS DE SUCESSO NO PAINEL
        const logClique = `[${timestamp}] ✅ Botão "${buttonToClick.label || 'Entrar'}" clicado em #${channel.name}`;
        await db.addLog(instanceId, "SUCCESS", logClique).catch(() => {});
        console.log(logClique);

        // 5. Envio de Mensagens Programadas (Após o clique)
        if (settings.mainMessage) {
            // Pequeno intervalo de segurança após o clique para a mensagem não bugar
            await new Promise(res => setTimeout(res, 1500));
            
            // Lógica de Menção Automática (Baseada no backup)
            let content = settings.mainMessage;
            const mentions = [
                ...(targetMsg.content || "").matchAll(/<@!?(\d+)>/g), 
                ...(targetMsg.embeds[0]?.description || "").matchAll(/<@!?(\d+)>/g),
                ...(targetMsg.embeds[0]?.fields || []).flatMap((f: any) => [...f.value.matchAll(/<@!?(\d+)>/g)])
            ]
            .map(m => m[1])
            .filter(id => id !== client.user?.id);
            
            if (mentions.length > 0) {
                const uniqueMentions = [...new Set(mentions)].map(id => `<@${id}>`).join(" ");
                content = `${uniqueMentions} ${content}`;
            }

            await channel.send(content).catch(console.error);
            
            const logMsg1 = `[${timestamp}] 📩 Mensagem enviada em #${channel.name}`;
            await db.addLog(instanceId, "SUCCESS", logMsg1).catch(() => {});

            if (settings.secondaryMessage) {
                await new Promise(res => setTimeout(res, 1000));
                await channel.send(settings.secondaryMessage).catch(console.error);
                const logMsg2 = `[${timestamp}] 📩 Mensagem secundária enviada em #${channel.name}`;
                await db.addLog(instanceId, "SUCCESS", logMsg2).catch(() => {});
            }
            
            // Incrementar estatísticas de forma acumulativa
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
