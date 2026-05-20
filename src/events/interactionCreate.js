const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} = require('discord.js');
const { generateCode, isCodeValid } = require('../utils/codeManager');

const UNVERIFIED_ROLE = '❌Unverified';
const VERIFIED_ROLE   = '✅Verified';
const MEMBER_ROLE_ID  = '1504852768563920936';

const PING_ROLES = [
  { id: '1504964221048455199', customId: 'ping_update'     },
  { id: '1504964041959931965', customId: 'ping_ann_script' },
  { id: '1504962681784766555', customId: 'ping_ann_hub'    },
  { id: '1504962613480525905', customId: 'ping_revive'     },
];

const STAFF_ROLE_IDS = [
  '1504850593678757969',
  '1504858498985627828',
  '1504860250925170818',
  '1506714071695757484',
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

    if (!interaction.isButton()) return;

    const { customId } = interaction;

    // ── Botão: Iniciar verificação ──────────────────────────────────
    if (customId === 'start_verify') {
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
    if (customId === 'send_code') {
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

    // ── Botões de Ping (toggle) ────────────────────────────────────
    const pingRole = PING_ROLES.find(r => r.customId === customId);
    if (pingRole) {
      await handlePingToggle(interaction, pingRole);
      return;
    }

    // ── Botão: Fechar Ticket ───────────────────────────────────────
    if (customId.startsWith('close_ticket_')) {
      await handleCloseTicket(interaction);
      return;
    }

    // ── Botões de Poll ─────────────────────────────────────────────
    if (customId.match(/^poll_\d+_\d+$/)) {
      await handlePollVote(interaction, client);
      return;
    }
  },
};

// ── Modal Submit ───────────────────────────────────────────────────
// (precisa estar no execute, mas Discord.js permite separar assim)
const originalModule = module.exports;
const origExecute    = originalModule.execute;
originalModule.execute = async function (interaction, client) {
  if (interaction.isModalSubmit() && interaction.customId === 'code_verify_modal') {
    await handleCodeValidation(
      interaction,
      client,
      interaction.fields.getTextInputValue('code_input').trim().toUpperCase()
    );
    return;
  }
  return origExecute(interaction, client);
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

  try {
    const guild  = await client.guilds.fetch(entry.guildId);
    const member = await guild.members.fetch(userId);

    const unverifiedRole = guild.roles.cache.find(r => r.name === UNVERIFIED_ROLE);
    if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
      await member.roles.remove(unverifiedRole);
    }

    const verifiedRole = guild.roles.cache.find(r => r.name === VERIFIED_ROLE);
    if (verifiedRole) await member.roles.add(verifiedRole);

    const memberRole = guild.roles.cache.get(MEMBER_ROLE_ID);
    if (memberRole) await member.roles.add(memberRole);

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
    await interaction.reply({ content: '❌ Não foi possível alterar o cargo.', ephemeral: true });
  }
}

// ── Fechar Ticket ──────────────────────────────────────────────────
async function handleCloseTicket(interaction) {
  const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
  const ticketOwnerId = interaction.customId.replace('close_ticket_', '');
  const isOwner = interaction.user.id === ticketOwnerId;

  if (!isStaff && !isOwner) {
    await interaction.reply({ content: '❌ Apenas a staff ou quem abriu o ticket pode fechá-lo.', ephemeral: true });
    return;
  }

  await interaction.reply({ content: '🔒 Fechando ticket em 5 segundos...' });
  setTimeout(async () => {
    try {
      await interaction.channel.delete();
    } catch (err) {
      console.error('[TICKET] Erro ao deletar canal:', err);
    }
  }, 5000);
}

// ── Votação na Poll ────────────────────────────────────────────────
async function handlePollVote(interaction, client) {
  const { buildPollEmbed } = require('../commands/poll');
  const pollVotes = client._pollVotes;

  if (!pollVotes) {
    await interaction.reply({ content: '❌ Dados da enquete não encontrados.', ephemeral: true });
    return;
  }

  // customId formato: poll_TIMESTAMP_OPCAOINDEX
  const parts   = interaction.customId.split('_');
  const pollId  = `poll_${parts[1]}`;
  const optIdx  = parseInt(parts[2]);
  const data    = pollVotes.get(pollId);

  if (!data) {
    await interaction.reply({ content: '❌ Enquete não encontrada ou expirada.', ephemeral: true });
    return;
  }

  const options = data._options;
  const chosen  = options[optIdx];
  const userId  = interaction.user.id;

  // Remove voto anterior se existia em outra opção
  for (const op of options) {
    data[op].delete(userId);
  }
  // Adiciona novo voto
  data[chosen].add(userId);

  // Atualiza o embed
  const newEmbed = buildPollEmbed(data._pergunta, data, data._author);
  await interaction.update({ embeds: [newEmbed] });
}

module.exports.handleCodeValidation = handleCodeValidation;
