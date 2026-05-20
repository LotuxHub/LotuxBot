const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt =>
      opt.setName('membro')
        .setDescription('Membro a ser expulso')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo da expulsão')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('membro');
    const motivo = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!target) {
      return interaction.reply({ content: '❌ Membro não encontrado no servidor.', ephemeral: true });
    }
    if (!target.kickable) {
      return interaction.reply({ content: '❌ Não consigo expulsar esse membro (cargo superior ou igual ao meu).', ephemeral: true });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Você não pode se expulsar.', ephemeral: true });
    }

    // Avisa por DM antes de expulsar
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xf97316)
        .setTitle('👢 Você foi expulso')
        .setDescription(
          `Você foi expulso do servidor **${interaction.guild.name}**.\n\n` +
          `**Motivo:** ${motivo}\n` +
          `**Por:** ${interaction.user.tag}`
        )
        .setTimestamp();
      await target.user.send({ embeds: [dmEmbed] });
    } catch {}

    try {
      await target.kick(motivo);

      const embed = new EmbedBuilder()
        .setColor(0xf97316)
        .setTitle('👢 Membro Expulso')
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: 'Membro', value: `${target.user} (${target.user.tag})`, inline: true },
          { name: 'Por',    value: interaction.user.tag,                   inline: true },
          { name: 'Motivo', value: motivo },
        )
        .setFooter({ text: `ID: ${target.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[KICK]', err);
      await interaction.reply({ content: '❌ Não foi possível expulsar esse membro.', ephemeral: true });
    }
  },
};
