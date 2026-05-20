const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Anuncia uma atualização do script')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('versao')
        .setDescription('Versão do update (ex: v2.1.0)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('novidades')
        .setDescription('O que foi adicionado/melhorado (use \\n para pular linha)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('correcoes')
        .setDescription('Bugs corrigidos (use \\n para pular linha)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('remocoes')
        .setDescription('O que foi removido (use \\n para pular linha)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('notas')
        .setDescription('Notas extras / observações importantes (use \\n para pular linha)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('mencionar')
        .setDescription('Cargo para mencionar (ex: @everyone)')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('imagem')
        .setDescription('Imagem/banner do update (opcional)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('cor')
        .setDescription('Cor do embed (padrão: verde). Nome ou hex (#FF5733)')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('separadores')
        .setDescription('Adicionar linha separadora entre seções? (padrão: sim)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const versao      = interaction.options.getString('versao');
    const novidades   = interaction.options.getString('novidades').replace(/\\n/g, '\n');
    const correcoes   = interaction.options.getString('correcoes')?.replace(/\\n/g, '\n') || null;
    const remocoes    = interaction.options.getString('remocoes')?.replace(/\\n/g, '\n')  || null;
    const notas       = interaction.options.getString('notas')?.replace(/\\n/g, '\n')     || null;
    const mencionar   = interaction.options.getString('mencionar') || null;
    const imagem      = interaction.options.getAttachment('imagem') || null;
    const corStr      = interaction.options.getString('cor') || null;
    const separadores = interaction.options.getBoolean('separadores') ?? true;

    // Parse de cor
    function parseColor(str) {
      if (!str) return 0x57F287;
      const names = {
        azul: 0x5865F2, verde: 0x57F287, vermelho: 0xED4245,
        amarelo: 0xFEE75C, laranja: 0xE67E22, roxo: 0x9B59B6,
        rosa: 0xFF73FA, branco: 0xFFFFFF, ouro: 0xF1C40F, ciano: 0x1ABC9C,
      };
      if (names[str.toLowerCase()]) return names[str.toLowerCase()];
      const parsed = parseInt(str.replace('#', ''), 16);
      return isNaN(parsed) ? 0x57F287 : parsed;
    }

    const sep = separadores ? '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━' : '';

    const embed = new EmbedBuilder()
      .setColor(parseColor(corStr))
      .setTitle(`🚀 Update ${versao}`)
      .setFooter({ text: `Lotux Hub • Update por ${interaction.user.tag}` })
      .setTimestamp();

    // Monta campos separados pra cada seção (mais limpo que description gigante)
    embed.addFields({ name: '✨ Novidades', value: novidades });

    if (correcoes) {
      if (separadores) embed.addFields({ name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━' });
      embed.addFields({ name: '🐛 Correções', value: correcoes });
    }

    if (remocoes) {
      if (separadores) embed.addFields({ name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━' });
      embed.addFields({ name: '🗑️ Removido', value: remocoes });
    }

    if (notas) {
      if (separadores) embed.addFields({ name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━' });
      embed.addFields({ name: '📝 Notas', value: notas });
    }

    if (imagem) embed.setImage(imagem.url);

    await interaction.reply({ content: '✅ Update enviado!', ephemeral: true });
    await interaction.channel.send({
      content: mencionar ?? undefined,
      embeds: [embed],
    });
  },
};