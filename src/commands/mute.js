const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

// Converte "30m", "2h", "1d" para milissegundos
function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d)$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit  = match[2].toLowerCase();
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return null;
}

function formatDuration(ms) {
  const s = ms / 1000;
  if (s < 3600)  return `${Math.round(s / 60)} minuto(s)`;
  if (s < 86400) return `${Math.round(s / 3600)} hora(s)`;
  return `${Math.round(s / 86400)} dia(s)`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Silencia um membro por um período (ex: 10m, 2h, 1d)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('membro')
        .setDescription('Membro a ser silenciado')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('duracao')
        .setDescription('Duração: ex. 10m, 2h, 1d (máx 28d)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do mute')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target   = interaction.options.getMember('membro');
    const duracaoStr = interaction.options.getString('duracao');
    const motivo   = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!target) {
      return interaction.reply({ content: '❌ Membro não encontrado no servidor.', ephemeral: true });
    }
    if (!target.moderatable) {
      return interaction.reply({ content: '❌ Não consigo silenciar esse membro (cargo superior ou igual ao meu).', ephemeral: true });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Você não pode se silenciar.', ephemeral: true });
    }

    const ms = parseDuration(duracaoStr);
    if (!ms) {
      return interaction.reply({ content: '❌ Duração inválida. Use o formato: `10m`, `2h`, `1d`.', ephemeral: true });
    }
    // Discord timeout máximo: 28 dias
    const MAX_MS = 28 * 24 * 60 * 60 * 1000;
    if (ms > MAX_MS) {
      return interaction.reply({ content: '❌ A duração máxima é de **28 dias**.', ephemeral: true });
    }

    try {
      await target.timeout(ms, motivo);

      const durLabel = formatDuration(ms);

      // Avisa por DM
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xfbbf24)
          .setTitle('🔇 Você foi silenciado')
          .setDescription(
            `Você foi silenciado no servidor **${interaction.guild.name}**.\n\n` +
            `**Duração:** ${durLabel}\n` +
            `**Motivo:** ${motivo}\n` +
            `**Por:** ${interaction.user.tag}`
          )
          .setTimestamp();
        await target.user.send({ embeds: [dmEmbed] });
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(0xfbbf24)
        .setTitle('🔇 Membro Silenciado')
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: 'Membro',   value: `${target.user} (${target.user.tag})`, inline: true },
          { name: 'Por',      value: interaction.user.tag,                   inline: true },
          { name: 'Duração',  value: durLabel,                               inline: true },
          { name: 'Motivo',   value: motivo },
        )
        .setFooter({ text: `ID: ${target.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[MUTE]', err);
      await interaction.reply({ content: '❌ Não foi possível silenciar esse membro.', ephemeral: true });
    }
  },
};
