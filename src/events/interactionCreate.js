const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { generateCode, isCodeValid } = require('../utils/codeManager');

const UNVERIFIED_ROLE = '❌Unverified';
const VERIFIED_ROLE   = '✅Verified';
const MEMBER_ROLE_ID  = '1504852768563920936'; // 👥Membro

const PING_ROLES = [
  { id: '1504964221048455199', customId: 'ping_update'     },
  { id: '1504964041959931965', customId: 'ping_ann_script' },
  { id: '1504962681784766555', customId: 'ping_ann_hub'    },
  { id: '1504962613480525905', customId: 'ping_revive'     },
];

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {

    // ── Slash Commands ──────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const msg = { content: '❌ Ocorreu um erro ao executar esse comando.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // ── Botão: Iniciar verificação ──────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'start_verify') {
      const userId = interaction.user.id;
      const guild  = interaction.guild;

      const code = generateCode();
      client.verificationCodes.set(userId, {
        code,
        guildId:   guild.id,
        guildName: guild.name,
        channelId: interaction.channelId,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('🔐 Código de Verificação')
          .setDescription(
            `Olá ${interaction.user}! Você está tentando verificar no servidor **\`${guild.name}\`**\n\n` +
            `Aqui está seu código de verificação:\n\n` +
            `**PC — Copiar:**\n\`\`\`${code}\`\`\`\n` +
            `**Mobile — Copiar e colar:**\n\`${code}\`\n\n` +
            `⏰ Expira em **10 minutos**.\n` +
            `Cole-o na mensagem que está no canal do servidor.`
          )
          .setFooter({ text: 'Lotux Bot v1.0.0 • Não compartilhe este código' })
          .setTimestamp();

        await interaction.user.send({ embeds: [dmEmbed] });
      } catch {
        await interaction.reply({
          content: '❌ Não consigo te enviar DM! Habilite mensagens diretas nas configurações do Discord.',
          ephemeral: true,
        });
        return;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('send_code')
          .setLabel('Send Code')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📨')
      );

      await interaction.reply({
        content:
          `${interaction.user} Um código foi enviado no seu PV! Copie-o e aperte **\`Send Code\`**.\n\n` +
          `A code was sent to your DM. Copy it and press **\`Send Code\`** to enter it.`,
        components: [row],
        ephemeral: true,
      });
      return;
    }

    // ── Botão: Abrir modal ─────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'send_code') {
      const modal = new ModalBuilder()
        .setCustomId('code_verify_modal')
        .setTitle('Code Verify');

      const codeInput = new TextInputBuilder()
        .setCustomId('code_input')
        .setLabel('Insira seu código de verificação')
        .setPlaceholder('Ex: A3F9B2')
        .setStyle(TextInputStyle.Short)
        .setMinLength(6)
        .setMaxLength(6)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
      await interaction.showModal(modal);
      return;
    }

    // ── Modal Submit: Validar código ───────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'code_verify_modal') {
      await handleCodeValidation(
        interaction,
        client,
        interaction.fields.getTextInputValue('code_input').trim().toUpperCase()
      );
      return;
    }

    // ── Botões de Ping (toggle de cargo) ───────────────────────────
    if (interaction.isButton()) {
      const pingRole = PING_ROLES.find(r => r.customId === interaction.customId);
      if (pingRole) {
        await handlePingToggle(interaction, pingRole);
        return;
      }
    }
  },
};

// ── Validação de código ────────────────────────────────────────────
async function handleCodeValidation(interaction, client, inputCode) {
  const userId = interaction.user.id;
  const entry  = client.verificationCodes.get(userId);

  if (!entry || !isCodeValid(entry)) {
    await interaction.reply({
      content: '❌ Código expirado ou não encontrado. Use `/verify` novamente para gerar um novo.',
      ephemeral: true,
    });
    client.verificationCodes.delete(userId);
    return;
  }

  if (inputCode !== entry.code) {
    await interaction.reply({
      content: '❌ Código incorreto! Verifique o código enviado no seu PV.',
      ephemeral: true,
    });
    return;
  }

  // ✅ Código correto
  try {
    const guild  = await client.guilds.fetch(entry.guildId);
    const member = await guild.members.fetch(userId);

    // Remove ❌Unverified
    const unverifiedRole = guild.roles.cache.find(r => r.name === UNVERIFIED_ROLE);
    if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
      await member.roles.remove(unverifiedRole);
    }

    // Adiciona ✅Verified
    const verifiedRole = guild.roles.cache.find(r => r.name === VERIFIED_ROLE);
    if (verifiedRole) await member.roles.add(verifiedRole);

    // Adiciona 👥Membro
    const memberRole = guild.roles.cache.get(MEMBER_ROLE_ID);
    if (memberRole) {
      await member.roles.add(memberRole);
    } else {
      console.warn(`[VERIFY] Cargo 👥Membro (${MEMBER_ROLE_ID}) não encontrado.`);
    }

    client.verificationCodes.delete(userId);

    const successEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅ Verificação Concluída!')
      .setDescription(
        `${interaction.user} foi verificado com sucesso no servidor **${guild.name}**!\n\n` +
        `You have been successfully verified in **${guild.name}**!`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });

  } catch (err) {
    console.error('[VERIFY] Erro ao trocar cargos:', err);
    await interaction.reply({
      content: '✅ Código correto! Porém não consegui alterar seus cargos. Contate um administrador.',
      ephemeral: true,
    });
  }
}

// ── Toggle de cargo de ping ────────────────────────────────────────
async function handlePingToggle(interaction, pingRole) {
  try {
    const member = interaction.member;
    const role   = interaction.guild.roles.cache.get(pingRole.id);

    if (!role) {
      await interaction.reply({ content: `❌ Cargo não encontrado no servidor.`, ephemeral: true });
      return;
    }

    const hasRole = member.roles.cache.has(role.id);
    if (hasRole) {
      await member.roles.remove(role);
      await interaction.reply({ content: `🔕 Cargo **${role.name}** removido!`, ephemeral: true });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: `🔔 Cargo **${role.name}** adicionado!`, ephemeral: true });
    }
  } catch (err) {
    console.error('[PING TOGGLE] Erro:', err);
    await interaction.reply({ content: '❌ Não foi possível alterar o cargo. Contate um administrador.', ephemeral: true });
  }
}

module.exports.handleCodeValidation = handleCodeValidation;
