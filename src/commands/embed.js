const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Converte nome de cor ou hex string para número
function parseColor(str) {
  if (!str) return 0x5865F2;
  const hex = str.trim().replace('#', '');
  // Nomes comuns
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
  const parsed = parseInt(hex, 16);
  return isNaN(parsed) ? 0x5865F2 : parsed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Cria um embed personalizado no canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('titulo')
        .setDescription('Título do embed')
        .setRequired(true)
        .setMaxLength(256)
    )
    .addStringOption(opt =>
      opt.setName('descricao')
        .setDescription('Descrição do embed (use \\n para quebrar linha)')
        .setRequired(true)
        .setMaxLength(4000)
    )
    .addStringOption(opt =>
      opt.setName('cor')
        .setDescription('Cor: nome (azul, verde, vermelho...) ou hex (#FF5733)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('rodape')
        .setDescription('Texto do rodapé')
        .setRequired(false)
        .setMaxLength(2048)
    )
    .addAttachmentOption(opt =>
      opt.setName('imagem')
        .setDescription('Imagem principal do embed')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('thumbnail')
        .setDescription('Imagem pequena no canto superior direito')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('campo1_nome')
        .setDescription('Nome do campo 1')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('campo1_valor')
        .setDescription('Valor do campo 1')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('campo2_nome')
        .setDescription('Nome do campo 2')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('campo2_valor')
        .setDescription('Valor do campo 2')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('campo3_nome')
        .setDescription('Nome do campo 3')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('campo3_valor')
        .setDescription('Valor do campo 3')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('mencionar')
        .setDescription('Cargo para mencionar (ex: @everyone)')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('timestamp')
        .setDescription('Mostrar data/hora no rodapé? (padrão: sim)')
        .setRequired(false)
    )
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal para enviar (padrão: canal atual)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const titulo     = interaction.options.getString('titulo');
    const descricao  = interaction.options.getString('descricao').replace(/\\n/g, '\n');
    const cor        = interaction.options.getString('cor') || null;
    const rodape     = interaction.options.getString('rodape') || null;
    const imagem     = interaction.options.getAttachment('imagem') || null;
    const thumbnail  = interaction.options.getAttachment('thumbnail') || null;
    const mencionar  = interaction.options.getString('mencionar') || null;
    const showTs     = interaction.options.getBoolean('timestamp') ?? true;
    const canal      = interaction.options.getChannel('canal') || interaction.channel;

    // Campos opcionais
    const campos = [];
    for (let i = 1; i <= 3; i++) {
      const nome  = interaction.options.getString(`campo${i}_nome`);
      const valor = interaction.options.getString(`campo${i}_valor`);
      if (nome && valor) {
        campos.push({ name: nome, value: valor, inline: true });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(parseColor(cor))
      .setTitle(titulo)
      .setDescription(descricao);

    if (campos.length > 0) embed.addFields(...campos);
    if (imagem)    embed.setImage(imagem.url);
    if (thumbnail) embed.setThumbnail(thumbnail.url);
    if (showTs)    embed.setTimestamp();

    embed.setFooter({
      text: rodape ?? `Lotux Hub • por ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL(),
    });

    // Preview ephemeral com botão de confirmar/cancelar
    const rowPreview = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('embed_confirm')
        .setLabel('✅ Enviar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('embed_cancel')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      content: `**Preview** — será enviado em ${canal}:`,
      embeds: [embed],
      components: [rowPreview],
      ephemeral: true,
    });

    // Aguarda clique no botão (60s)
    const filter = i => i.user.id === interaction.user.id && ['embed_confirm', 'embed_cancel'].includes(i.customId);
    let collector;
    try {
      collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000, max: 1 });
    } catch {
      // fallback: envia direto se não conseguir criar collector
      await canal.send({ content: mencionar ?? undefined, embeds: [embed] });
      return;
    }

    collector.on('collect', async btn => {
      if (btn.customId === 'embed_cancel') {
        await btn.update({ content: '❌ Embed cancelado.', embeds: [], components: [] });
        return;
      }

      try {
        await canal.send({ content: mencionar ?? undefined, embeds: [embed] });
        await btn.update({
          content: `✅ Embed enviado em ${canal}!`,
          embeds: [],
          components: [],
        });
      } catch (err) {
        console.error('[EMBED]', err);
        await btn.update({ content: '❌ Erro ao enviar o embed.', embeds: [], components: [] });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        try {
          await interaction.editReply({ content: '⏰ Tempo esgotado. Embed cancelado.', embeds: [], components: [] });
        } catch {}
      }
    });
  },
};
