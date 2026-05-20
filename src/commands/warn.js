const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

// Registro de avisos em memória: userId -> [{ motivo, por, data }]
const warnings = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Gerencia advertências de membros')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adverte um membro')
        .addUserOption(opt =>
          opt.setName('membro').setDescription('Membro a advertir').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('motivo').setDescription('Motivo da advertência').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lista as advertências de um membro')
        .addUserOption(opt =>
          opt.setName('membro').setDescription('Membro a consultar').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove uma advertência pelo número')
        .addUserOption(opt =>
          opt.setName('membro').setDescription('Membro').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('numero').setDescription('Número da advertência (use /warn list para ver)').setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Limpa todas as advertências de um membro')
        .addUserOption(opt =>
          opt.setName('membro').setDescription('Membro').setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub    = interaction.options.getSubcommand();
    const membro = interaction.options.getUser('membro');

    // ── ADD ──────────────────────────────────────────────────────────
    if (sub === 'add') {
      const motivo = interaction.options.getString('motivo');

      if (!warnings.has(membro.id)) warnings.set(membro.id, []);
      warnings.get(membro.id).push({
        motivo,
        por:  interaction.user.tag,
        data: new Date().toLocaleString('pt-BR'),
      });

      const total = warnings.get(membro.id).length;

      // DM para o advertido
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xfbbf24)
          .setTitle('⚠️ Você recebeu uma advertência')
          .setDescription(
            `Você foi advertido no servidor **${interaction.guild.name}**.\n\n` +
            `**Motivo:** ${motivo}\n` +
            `**Por:** ${interaction.user.tag}\n\n` +
            `Esta é sua **${total}ª** advertência.`
          )
          .setTimestamp();
        await membro.send({ embeds: [dmEmbed] });
      } catch { /* DM fechada */ }

      const embed = new EmbedBuilder()
        .setColor(0xfbbf24)
        .setTitle('⚠️ Advertência Aplicada')
        .addFields(
          { name: 'Membro',       value: `${membro} (${membro.tag})`, inline: true },
          { name: 'Por',          value: interaction.user.tag,         inline: true },
          { name: 'Motivo',       value: motivo },
          { name: 'Total de warns', value: `${total}`,                 inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // ── LIST ─────────────────────────────────────────────────────────
    if (sub === 'list') {
      const list = warnings.get(membro.id) || [];

      if (list.length === 0) {
        await interaction.reply({ content: `✅ ${membro} não possui advertências.`, ephemeral: true });
        return;
      }

      const lines = list.map((w, i) =>
        `**#${i + 1}** — ${w.motivo}\n> Por ${w.por} em ${w.data}`
      ).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0xfbbf24)
        .setTitle(`📋 Advertências de ${membro.tag}`)
        .setDescription(lines)
        .setFooter({ text: `Total: ${list.length} advertência(s)` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // ── REMOVE ───────────────────────────────────────────────────────
    if (sub === 'remove') {
      const num  = interaction.options.getInteger('numero');
      const list = warnings.get(membro.id) || [];

      if (num > list.length || list.length === 0) {
        await interaction.reply({ content: `❌ Advertência #${num} não encontrada.`, ephemeral: true });
        return;
      }

      list.splice(num - 1, 1);
      await interaction.reply({
        content: `✅ Advertência #${num} de ${membro} removida. Total restante: **${list.length}**`,
        ephemeral: true,
      });
      return;
    }

    // ── CLEAR ────────────────────────────────────────────────────────
    if (sub === 'clear') {
      warnings.delete(membro.id);
      await interaction.reply({
        content: `✅ Todas as advertências de ${membro} foram removidas.`,
        ephemeral: true,
      });
    }
  },
};

module.exports.warnings = warnings;
