const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove o timeout (mute) de um membro antes do tempo acabar')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('membro')
        .setDescription('Membro a ter o mute removido')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do unmute (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('membro');
    const motivo = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!target) {
      return interaction.reply({ content: '❌ Membro não encontrado no servidor.', ephemeral: true });
    }

    if (!target.isCommunicationDisabled()) {
      return interaction.reply({ content: `❌ ${target.user.tag} não está silenciado.`, ephemeral: true });
    }

    if (!target.moderatable) {
      return interaction.reply({ content: '❌ Não consigo remover o mute desse membro.', ephemeral: true });
    }

    try {
      await target.timeout(null, motivo); // null remove o timeout

      // Avisa por DM
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0x4ade80)
          .setTitle('🔊 Seu mute foi removido')
          .setDescription(
            `Seu silenciamento no servidor **${interaction.guild.name}** foi removido.\n\n` +
            `**Motivo:** ${motivo}\n` +
            `**Por:** ${interaction.user.tag}`
          )
          .setTimestamp();
        await target.user.send({ embeds: [dmEmbed] });
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(0x4ade80)
        .setTitle('🔊 Mute Removido')
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: '👤 Membro', value: `${target.user} (${target.user.tag})`, inline: true },
          { name: '🛡️ Por',   value: interaction.user.tag,                   inline: true },
          { name: '📋 Motivo', value: motivo },
        )
        .setFooter({ text: `ID: ${target.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[UNMUTE]', err);
      await interaction.reply({ content: '❌ Não foi possível remover o mute.', ephemeral: true });
    }
  },
};
