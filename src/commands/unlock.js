const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Desbloqueia o canal para membros enviarem mensagens novamente')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do desbloqueio (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const motivo  = interaction.options.getString('motivo') || 'Sem motivo informado';
    const channel = interaction.channel;
    const everyone = interaction.guild.roles.everyone;

    // Verifica se está bloqueado
    const currentPerms = channel.permissionOverwrites.cache.get(everyone.id);
    if (!currentPerms?.deny?.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({ content: '❌ Este canal não está bloqueado.', ephemeral: true });
    }

    try {
      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: null, // null = volta ao padrão do cargo/servidor
      });

      const embed = new EmbedBuilder()
        .setColor(0x4ade80)
        .setTitle('🔓 Canal Desbloqueado')
        .setDescription(`Este canal foi desbloqueado. Membros podem enviar mensagens novamente.`)
        .addFields(
          { name: 'Por',    value: interaction.user.tag, inline: true },
          { name: 'Motivo', value: motivo },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[UNLOCK]', err);
      await interaction.reply({ content: '❌ Não foi possível desbloquear o canal.', ephemeral: true });
    }
  },
};
