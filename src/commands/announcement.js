const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

function parseColor(str) {
  if (!str) return 0x5865F2;
  const names = {
    azul: 0x5865F2, blue: 0x5865F2,
    verde: 0x57F287, green: 0x57F287,
    vermelho: 0xED4245, red: 0xED4245,
    amarelo: 0xFEE75C, yellow: 0xFEE75C,
    laranja: 0xE67E22, orange: 0xE67E22,
    roxo: 0x9B59B6, purple: 0x9B59B6,
    rosa: 0xFF73FA, pink: 0xFF73FA,
    branco: 0xFFFFFF, white: 0xFFFFFF,
    preto: 0x23272A, black: 0x23272A,
    ouro: 0xF1C40F, gold: 0xF1C40F,
    ciano: 0x1ABC9C, cyan: 0x1ABC9C,
  };
  if (names[str.toLowerCase()]) return names[str.toLowerCase()];
  const parsed = parseInt(str.replace('#', ''), 16);
  return isNaN(parsed) ? 0x5865F2 : parsed;
}

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
        .setDescription('Conteúdo do anúncio (use \\n para pular linha)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mencionar')
        .setDescription('Cargo para mencionar (ex: @everyone, @Membro)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('cor')
        .setDescription('Cor do embed (ex: azul, verde, vermelho, ouro ou #FF5733)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('rodape')
        .setDescription('Texto personalizado no rodapé')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('imagem')
        .setDescription('Imagem principal do anúncio')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('thumbnail')
        .setDescription('Imagem pequena no canto superior direito')
        .setRequired(false)
    )
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Enviar em outro canal (padrão: canal atual)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const titulo    = interaction.options.getString('titulo');
    const mensagem  = interaction.options.getString('mensagem').replace(/\\n/g, '\n');
    const mencionar = interaction.options.getString('mencionar') || null;
    const corStr    = interaction.options.getString('cor') || null;
    const rodape    = interaction.options.getString('rodape') || null;
    const imagem    = interaction.options.getAttachment('imagem') || null;
    const thumbnail = interaction.options.getAttachment('thumbnail') || null;
    const canal     = interaction.options.getChannel('canal') || interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(parseColor(corStr))
      .setTitle(`📢 ${titulo}`)
      .setDescription(mensagem)
      .setFooter({
        text: rodape ?? `Lotux Hub • Anúncio por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (imagem)    embed.setImage(imagem.url);
    if (thumbnail) embed.setThumbnail(thumbnail.url);

    await interaction.reply({ content: `✅ Anúncio enviado em ${canal}!`, ephemeral: true });
    await canal.send({
      content: mencionar ?? undefined,
      embeds: [embed],
    });
  },
};