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
        .setDescription('O que foi adicionado/melhorado')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('correcoes')
        .setDescription('Bugs corrigidos (opcional)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('remocoes')
        .setDescription('O que foi removido (opcional)')
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
    ),

  async execute(interaction) {
    const versao    = interaction.options.getString('versao');
    const novidades = interaction.options.getString('novidades');
    const correcoes = interaction.options.getString('correcoes') || null;
    const remocoes  = interaction.options.getString('remocoes')  || null;
    const mencionar = interaction.options.getString('mencionar') || null;
    const imagem    = interaction.options.getAttachment('imagem') || null;

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(`🚀 Update ${versao}`)
      .setFooter({ text: `Lotux Hub • Update por ${interaction.user.tag}` })
      .setTimestamp();

    let desc = `## ✨ Novidades\n${novidades}`;
    if (correcoes) desc += `\n\n## 🐛 Correções\n${correcoes}`;
    if (remocoes)  desc += `\n\n## 🗑️ Removido\n${remocoes}`;

    embed.setDescription(desc);
    if (imagem) embed.setImage(imagem.url);

    await interaction.reply({ content: '✅ Update enviado!', ephemeral: true });
    await interaction.channel.send({
      content: mencionar ?? undefined,
      embeds: [embed],
    });
  },
};
