const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Inicia o processo de verificação do servidor'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 Bot De Verificação')
      .setDescription(
        '**PT-BR:** Para verificar aperta no botão `Verify` e depois ele mandará 2 mensagens pra você:\n' +
        '• Uma com o **código de verificação** no seu PV\n' +
        '• Outra é um botão aqui no canal para você **inserir o código**\n\n' +
        '**EN:** To verify, press the `Verify` button and then it will send 2 messages to you:\n' +
        '• One with the **verification code** in your DM\n' +
        '• Another is a button here in the channel for you to **enter the code**'
      )
      .setFooter({ text: 'Lotux Bot v1.0.0' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('start_verify')
        .setLabel('Verify')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✅')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
