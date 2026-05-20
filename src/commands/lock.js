const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Bloqueia o canal para membros normais enviarem mensagens')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do bloqueio (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const motivo  = interaction.options.getString('motivo') || 'Sem motivo informado';
    const channel = interaction.channel;
    const everyone = interaction.guild.roles.everyone;

    // Verifica se já está bloqueado
    const currentPerms = channel.permissionOverwrites.cache.get(everyone.id);
    if (currentPerms?.deny?.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({ content: '❌ Este canal já está bloqueado.', ephemeral: true });
    }

    try {
      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: false,
      });

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🔒 Canal Bloqueado')
        .setDescription(`Este canal foi bloqueado. Membros não podem mais enviar mensagens aqui.`)
        .addFields(
          { name: 'Por',    value: interaction.user.tag, inline: true },
          { name: 'Motivo', value: motivo },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[LOCK]', err);
      await interaction.reply({ content: '❌ Não foi possível bloquear o canal.', ephemeral: true });
    }
  },
};
