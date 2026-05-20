const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Deleta mensagens do canal (máx 100)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('quantidade')
        .setDescription('Número de mensagens a deletar (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(opt =>
      opt.setName('membro')
        .setDescription('Deletar apenas mensagens deste membro (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const quantidade = interaction.options.getInteger('quantidade');
    const filtroUser = interaction.options.getUser('membro') || null;

    await interaction.deferReply({ ephemeral: true });

    try {
      // Busca as mensagens
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      // Filtra por usuário se especificado
      if (filtroUser) {
        messages = messages.filter(m => m.author.id === filtroUser.id);
      }

      // Pega só a quantidade pedida
      messages = messages.first(quantidade);

      // Discord só permite bulkDelete em mensagens com menos de 14 dias
      const deleted = await interaction.channel.bulkDelete(messages, true);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🗑️ Mensagens Deletadas')
        .addFields(
          { name: 'Deletadas',  value: `${deleted.size}`,                                    inline: true },
          { name: 'Canal',      value: `${interaction.channel}`,                              inline: true },
          { name: 'Por',        value: interaction.user.tag,                                  inline: true },
          ...(filtroUser ? [{ name: 'Filtro', value: filtroUser.tag, inline: true }] : []),
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('[CLEAR]', err);
      await interaction.editReply({ content: '❌ Não foi possível deletar as mensagens. Mensagens com mais de 14 dias não podem ser deletadas em massa.' });
    }
  },
};
