const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const LOG_BAN_CHANNEL = '1504857660699185182';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('membro')
        .setDescription('Membro a ser banido')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do ban')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('dias')
        .setDescription('Deletar mensagens dos últimos X dias (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membro');
    const motivo = interaction.options.getString('motivo') || 'Sem motivo informado';
    const dias   = interaction.options.getInteger('dias') ?? 0;

    const member = interaction.guild.members.cache.get(target.id);

    if (member) {
      if (!member.bannable) {
        return interaction.reply({ content: '❌ Não consigo banir esse membro (cargo superior ou igual ao meu).', ephemeral: true });
      }
      if (member.id === interaction.user.id) {
        return interaction.reply({ content: '❌ Você não pode se banir.', ephemeral: true });
      }

      // Tenta avisar por DM antes de banir
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('🔨 Você foi banido')
          .setDescription(
            `Você foi banido do servidor **${interaction.guild.name}**.\n\n` +
            `**Motivo:** ${motivo}\n` +
            `**Por:** ${interaction.user.tag}`
          )
          .setTimestamp();
        await target.send({ embeds: [dmEmbed] });
      } catch {}
    }

    try {
      await interaction.guild.members.ban(target.id, { reason: motivo, deleteMessageDays: dias });

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🔨 Membro Banido')
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'Membro',  value: `${target} (${target.tag})`, inline: true },
          { name: 'Por',     value: interaction.user.tag,         inline: true },
          { name: 'Motivo',  value: motivo },
          { name: 'Msgs deletadas', value: `${dias} dia(s)`,      inline: true },
        )
        .setFooter({ text: `ID: ${target.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log no canal de ban
      const logChannel = interaction.guild.channels.cache.get(LOG_BAN_CHANNEL);
      if (logChannel) await logChannel.send({ embeds: [embed] });

    } catch (err) {
      console.error('[BAN]', err);
      await interaction.reply({ content: '❌ Não foi possível banir esse membro.', ephemeral: true });
    }
  },
};
