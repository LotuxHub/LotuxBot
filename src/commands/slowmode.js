const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

function formatSlowmode(s) {
  if (s === 0) return 'Desativado';
  if (s < 60)  return `${s} segundo(s)`;
  if (s < 3600) return `${Math.floor(s / 60)} minuto(s)`;
  return `${Math.floor(s / 3600)} hora(s)`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Define o modo lento do canal (0 para desativar)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt =>
      opt.setName('segundos')
        .setDescription('Intervalo em segundos (0 = desativar, máx 21600 = 6h)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const segundos = interaction.options.getInteger('segundos');
    const motivo   = interaction.options.getString('motivo') || 'Sem motivo informado';

    try {
      await interaction.channel.setRateLimitPerUser(segundos, motivo);

      const desativando = segundos === 0;

      const embed = new EmbedBuilder()
        .setColor(desativando ? 0x4ade80 : 0xfbbf24)
        .setTitle(desativando ? '✅ Slowmode Desativado' : '🐌 Slowmode Ativado')
        .addFields(
          { name: '📺 Canal',    value: `${interaction.channel}`,  inline: true },
          { name: '⏱️ Intervalo', value: formatSlowmode(segundos), inline: true },
          { name: '🛡️ Por',     value: interaction.user.tag,       inline: true },
          ...(desativando ? [] : [{ name: '📋 Motivo', value: motivo }]),
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[SLOWMODE]', err);
      await interaction.reply({ content: '❌ Não foi possível alterar o slowmode.', ephemeral: true });
    }
  },
};
