const { InteractionType, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder, ChannelType } = require("discord.js");
const { lg, owner, us, ks } = require("../../databases/index");
const { Client } = require('discord.js-selfbot-v13');
let verify = {}

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { user, customId, guild, channel, fields, values } = interaction;
        if (!customId) return;

        if (customId === "system_queues_join") {
            const option = values[0];
            const userData = (await us.get(`${user.id}`)) || {};

            interaction.message.edit({
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("system_queues_join")
                                .setMaxValues(1)
                                .setMinValues(1)
                                .setPlaceholder("Selecione uma opção")
                                .addOptions(
                                    {
                                        label: "Configuração",
                                        description: "Configure o sistema de Filas",
                                        emoji: "<:cloner_template_config:1488068429578768384>",
                                        value: "config"
                                    },
                                    {
                                        label: "Iniciar",
                                        description: "Inicie o sistema de Entrada automatica",
                                        emoji: "<:1289362432996806657:1479488984697667654>",
                                        value: "inic"
                                    }
                                )
                        )
                ]
            });

            if (option === "config") {
                const modal = new ModalBuilder()
                    .setCustomId("config_system_queue")
                    .setTitle("Configure suas Filas");

                const token = new TextInputBuilder()
                    .setCustomId("token")
                    .setLabel("Token do Usuario")
                    .setStyle(1)
                    .setRequired(true);
                if (userData.token) token.setValue(userData.token);

                const msgauto = new TextInputBuilder()
                    .setCustomId("msgauto")
                    .setLabel("Deseja enviar mensagem na fila?")
                    .setStyle(2)
                    .setRequired(false)
                    .setMaxLength(2000)
                    .setPlaceholder("Envia mensagem na fila\nDeixe vazio caso não queira");
                if (userData.msgauto) msgauto.setValue(userData.msgauto);

                const mentionauto = new TextInputBuilder()
                    .setCustomId("mentionauto")
                    .setLabel("Marcar o Adversário? ")
                    .setStyle(1)
                    .setRequired(false)
                    .setMaxLength(3)
                    .setPlaceholder("Coloque quantos segundos deseja. (Deixe vazio caso não queira)");
                if (userData.mentionauto) mentionauto.setValue(`${userData.mentionauto}`);

                const confirmauto = new TextInputBuilder()
                    .setCustomId("confirmauto")
                    .setLabel("Confirmar Fila Automático? ")
                    .setStyle(1)
                    .setRequired(false)
                    .setMaxLength(3)
                    .setPlaceholder("Coloque quantos segundos para confirmar . (Deixe vazio caso não queira)");
                if (userData.confirmauto) confirmauto.setValue(`${userData.confirmauto}`);

                modal.addComponents(new ActionRowBuilder().addComponents(token));
                modal.addComponents(new ActionRowBuilder().addComponents(msgauto));
                modal.addComponents(new ActionRowBuilder().addComponents(mentionauto));
                modal.addComponents(new ActionRowBuilder().addComponents(confirmauto));

                return interaction.showModal(modal);
            } else if (option === "inic") {
                interaction.reply({
                    content: `\<:white_lupa7cr:1488891816081100950>\ Escolha o formato da fila desejada.\n\n- Fila: \`N/A\`\n- Tipo da Fila: \`N/A\``,
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId("inic_select")
                                    .setMaxValues(1)
                                    .setMinValues(1)
                                    .setPlaceholder("Selecione o formato que desejado")
                                    .addOptions(
                                        { label: "1x1", value: "1v1" },
                                        { label: "2x2", value: "2v2" },
                                        { label: "3x3", value: "3v3" },
                                        { label: "4x4", value: "4v4" },
                                        { label: "Selecionar Todos", value: "all" }
                                    )
                            )
                    ],
                    flags: [64]
                });
            }
        }

        if (customId === "inic_select") {
            const format = values[0];
            const options = [];

            if (format === "1v1" || format === "all") {
                options.push(
                    { label: "📱 Mobile", value: "group_mobile" },
                    { label: "🖥️ Emulador", value: "group_emu" },
                    { label: "❗ Tático Mobile", value: "tatico_mobile" },
                    { label: "❗ Tático Emulador", value: "tatico_emu" }
                );
            } else if (["2v2", "3v3", "4v4"].includes(format)) {
                options.push(
                    { label: "📱 Mobile", value: "mobile" },
                    { label: "🖥️ Emulador", value: "emu" },
                    { label: "❗ Tático Mobile", value: "tatico_mobile" },
                    { label: "❗ Tático Emulador", value: "tatico_emu" }
                );
                const mistoCount = parseInt(format[0]);
                for (let i = 1; i < mistoCount; i++) {
                    options.push({ label: `Misto ${i} Emu`, value: `misto_${i}_emu` });
                }
            }

            options.push({
                label: "Voltar",
                emoji: "<:hyperapps26:1215836101080776704>",
                value: "voltar"
            });

            interaction.update({
                content: `\<:white_lupa7cr:1488891816081100950>\ Escolha o Tipo que você deseja.\n\n- Formato da Fila: \`${format}\`\n- Tipo da Fila: \`N/A\``,
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`type_select_${format}`)
                                .setMaxValues(1)
                                .setMinValues(1)
                                .setPlaceholder("Selecione o Tipo")
                                .addOptions(options)
                        )
                ]
            });
        }

        if (customId.startsWith("type_select_")) {
            const format = customId.split("type_select_")[1];
            const type = values[0];

            if (type === "voltar") return interaction.update({
                content: `\<:white_lupa7cr:1488891816081100950>\ Escolha o Formato que você deseja.\n\n- Formato da Fila: \`N/A\`\n- Tipo da Fila: \`N/A\``,
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("inic_select")
                                .setMaxValues(1)
                                .setMinValues(1)
                                .setPlaceholder("Selecione o formato que deseja")
                                .addOptions(
                                    { label: "1x1", value: "1v1" },
                                    { label: "2x2", value: "2v2" },
                                    { label: "3x3", value: "3v3" },
                                    { label: "4x4", value: "4v4" },
                                    { label: "Selecionar Todos", value: "all" }
                                )
                        )
                ],
            });

            // Start logic automatically after type selection
            await interaction.deferReply({ ephemeral: true });
            const userData = await us.get(`${user.id}`);
            if (!userData || !userData.token) return interaction.editReply({ content: "`❌` Você não configurou seu Token. Use o menu de Configuração." });

            const typeLabel = type.replace("group_", "").replace("_", " ").toUpperCase();
            
            await interaction.editReply({
                content: `\<:1289362432996806657:1479488984697667654>\ Iniciando sistema...\n- Formato: \`${format}\`\n- Tipo: \`${typeLabel}\``,
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`stop_bot_${user.id}`)
                                .setLabel("Stop")
                                .setEmoji("⏹️")
                                .setStyle(4)
                        )
                ]
            });

            try {
                const self = new Client();
                await self.login(userData.token);

                const canais = client.channels.cache.filter(c => c.type === ChannelType.GuildText && c.name.includes("fila"));
                const processing = new Set();

                const pushLog = async (type, channelId, value, desc) => {
                    await lg.push(`${self.user.id}.logs`, {
                        type,
                        channelId,
                        value,
                        desc,
                        timestamp: Date.now()
                    });
                };

                const cleanName = (name) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                const interval = setInterval(async () => {
                    try {
                        for (const channel of canais.values()) {
                            if (processing.has(channel.id)) continue;
                            processing.add(channel.id);

                            try {
                                const msgs = await channel.messages.fetch({ limit: 15 });
                                const validMsgs = msgs.filter(m => m.embeds.length > 0 && m.components.length > 0);

                                for (const msg of validMsgs.values()) {
                                    // Auto-click logic based on group/type
                                    for (const row of msg.components) {
                                        for (const button of row.components) {
                                            const normLabel = cleanName(button.label || "");
                                            let shouldClick = false;

                                            if (type === "group_mobile") {
                                                if (normLabel.includes("mobile")) shouldClick = true;
                                            } else if (type === "group_emu") {
                                                if (normLabel.includes("emulador") || normLabel.includes("emu")) shouldClick = true;
                                            } else if (type === "tatico_mobile") {
                                                if (normLabel.includes("tatico") && normLabel.includes("mobile")) shouldClick = true;
                                            } else if (type === "tatico_emu") {
                                                if (normLabel.includes("tatico") && (normLabel.includes("emulador") || normLabel.includes("emu"))) shouldClick = true;
                                            } else if (type === "mobile") {
                                                if (normLabel.includes("mobile")) shouldClick = true;
                                            } else if (type === "emu") {
                                                if (normLabel.includes("emulador") || normLabel.includes("emu")) shouldClick = true;
                                            } else if (type.startsWith("misto_")) {
                                                const num = type.split("_")[1];
                                                if (normLabel.includes("misto") && normLabel.includes(num)) shouldClick = true;
                                            }

                                            if (shouldClick) {
                                                try {
                                                    await msg.clickButton(button.customId);
                                                    await pushLog("entradas", channel.id, "0.00", `Botão clicado automaticamente: ${button.label}`);
                                                } catch {}
                                            }
                                        }
                                    }
                                    
                                    // Handle auto-confirm and auto-mention
                                    if (userData.confirmauto) {
                                        const jaConfirmou = await lg.get(`${self.user.id}.confirmauto.${msg.id}`);
                                        if (!jaConfirmou) {
                                            const isConfirmMsg = msg.embeds[0]?.description?.toLowerCase().includes("confirmar") || msg.content?.toLowerCase().includes("confirmar");
                                            if (isConfirmMsg) {
                                                await new Promise(res => setTimeout(res, userData.confirmauto * 1000));
                                                for (const row of msg.components) {
                                                    for (const button of row.components) {
                                                        if (["confirmar", "aceitar", "pronto"].includes(button.label?.toLowerCase())) {
                                                            try {
                                                                await msg.clickButton(button.customId);
                                                                await lg.set(`${self.user.id}.confirmauto.${msg.id}`, true);
                                                            } catch {}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (err) {
                            } finally {
                                setTimeout(() => processing.delete(channel.id), 2000);
                            }
                        }
                    } catch (err) {}
                }, 3000);

                verify[user.id] = { client: self, interval };

            } catch (err) {
                interaction.editReply({ content: `\`❌\` Erro ao iniciar: ${err.message}` });
            }
        }

        if (customId.startsWith("stop_bot_")) {
            const targetId = customId.split("stop_bot_")[1];
            if (user.id !== targetId) return interaction.reply({ content: "Você não pode parar o bot de outra pessoa.", flags: [64] });

            const v = verify[user.id];
            if (v) {
                try { clearInterval(v.interval); } catch {}
                try { await v.client.destroy(); } catch {}
                delete verify[user.id];
                return interaction.update({ content: "⏹️ Bot parado com sucesso.", components: [] });
            } else {
                return interaction.update({ content: "O bot já está parado.", components: [] });
            }
        }

        if (customId === "config_system_queue") {
            const token = fields.getTextInputValue("token");
            const msgauto = fields.getTextInputValue("msgauto") || false;
            const mentionautoNumber = fields.getTextInputValue("mentionauto") || false;
            const confirmautoNumber = fields.getTextInputValue("confirmauto") || false;

            await interaction.reply({ content: `\<:1289362432996806657:1479488984697667654>\ Atualizando configurações...`, flags: [64] });

            try {
                const self = new Client();
                await self.login(token);
                await self.destroy();
                
                await us.set(`${user.id}.token`, token);
                await us.set(`${user.id}.msgauto`, msgauto);
                
                if (mentionautoNumber) {
                    const mentionauto = parseFloat(mentionautoNumber.replace(",", "."));
                    if (!isNaN(mentionauto)) await us.set(`${user.id}.mentionauto`, mentionauto);
                } else {
                    await us.set(`${user.id}.mentionauto`, false);
                }

                if (confirmautoNumber) {
                    const confirmauto = parseFloat(confirmautoNumber.replace(",", "."));
                    if (!isNaN(confirmauto)) await us.set(`${user.id}.confirmauto`, confirmauto);
                } else {
                    await us.set(`${user.id}.confirmauto`, false);
                }

                return interaction.editReply({ content: "✅ Configurações salvas com sucesso!" });
            } catch {
                return interaction.editReply({ content: "❌ Token inválido." });
            }
        }
    }
};
