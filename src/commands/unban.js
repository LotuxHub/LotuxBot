const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Remove o ban de um usuário pelo ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt =>
      opt.setName('userid')
        .setDescription('ID do usuário banido')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do unban (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('userid').trim();
    const motivo = interaction.options.getString('motivo') || 'Sem motivo informado';

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ content: '❌ ID inválido. Use o ID numérico do usuário (ex: `123456789012345678`).', ephemeral: true });
    }

    try {
      const banList = await interaction.guild.bans.fetch();
      const banned  = banList.get(userId);

      if (!banned) {
        return interaction.reply({ content: `❌ Nenhum ban encontrado para o ID \`${userId}\`.`, ephemeral: true });
      }

      await interaction.guild.members.unban(userId, motivo);

      const embed = new EmbedBuilder()
        .setColor(0x4ade80)
        .setTitle('✅ Ban Removido')
        .setThumbnail(banned.user.displayAvatarURL())
        .addFields(
          { name: '👤 Usuário', value: `${banned.user.tag}`, inline: true },
          { name: '🆔 ID',      value: userId,                inline: true },
          { name: '🛡️ Por',    value: interaction.user.tag,  inline: true },
          { name: '📋 Motivo',  value: motivo },
        )
        .setFooter({ text: `Lotux Bot • Unban` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('[UNBAN]', err);
      await interaction.reply({ content: '❌ Não foi possível remover o ban. Verifique se o ID está correto.', ephemeral: true });
    }
  },
};
