const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Envia um anúncio no canal atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('titulo')
        .setDescription('Título do anúncio')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mensagem')
        .setDescription('Conteúdo do anúncio')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mencionar')
        .setDescription('Cargo para mencionar (ex: @everyone, @Membro)')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('imagem')
        .setDescription('Imagem para anexar ao anúncio')
        .setRequired(false)
    ),

  async execute(interaction) {
    const titulo    = interaction.options.getString('titulo');
    const mensagem  = interaction.options.getString('mensagem');
    const mencionar = interaction.options.getString('mencionar') || null;
    const imagem    = interaction.options.getAttachment('imagem') || null;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📢 ${titulo}`)
      .setDescription(mensagem)
      .setFooter({ text: `Lotux Hub • Anúncio por ${interaction.user.tag}` })
      .setTimestamp();

    if (imagem) embed.setImage(imagem.url);

    await interaction.reply({ content: '✅ Anúncio enviado!', ephemeral: true });
    await interaction.channel.send({
      content: mencionar ?? undefined,
      embeds: [embed],
    });
  },
};
