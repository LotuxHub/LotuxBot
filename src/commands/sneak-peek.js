const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sneak-peek')
    .setDescription('Mostra um sneak peek do que está por vir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('mensagem')
        .setDescription('Texto do sneak peek (opcional)')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('imagem')
        .setDescription('Imagem do sneak peek (opcional)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('mencionar')
        .setDescription('Cargo para mencionar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const mensagem  = interaction.options.getString('mensagem')  || null;
    const imagem    = interaction.options.getAttachment('imagem') || null;
    const mencionar = interaction.options.getString('mencionar') || null;

    // Precisa de pelo menos mensagem ou imagem
    if (!mensagem && !imagem) {
      await interaction.reply({
        content: '❌ Você precisa enviar pelo menos uma **mensagem** ou uma **imagem**.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x9b59f5)
      .setTitle('👀 Sneak Peek')
      .setFooter({ text: `Lotux Hub • algo está chegando...` })
      .setTimestamp();

    if (mensagem) embed.setDescription(mensagem);
    if (imagem)   embed.setImage(imagem.url);

    await interaction.reply({ content: '✅ Sneak peek enviado!', ephemeral: true });
    await interaction.channel.send({
      content: mencionar ?? undefined,
      embeds: [embed],
    });
  },
};
