const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

const PING_ROLES = [
  { id: '1504964221048455199', label: '📢Update Script',          customId: 'ping_update'     },
  { id: '1504964041959931965', label: '📢Annunciament Script',    customId: 'ping_ann_script' },
  { id: '1504962681784766555', label: '📢Lotux Hub Annunciament', customId: 'ping_ann_hub'    },
  { id: '1504962613480525905', label: '⚽Chat Revive',            customId: 'ping_revive'     },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Escolha os cargos de notificação que deseja receber'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Ping')
      .setDescription(
        '**PT-BR**\n' +
        '<@&1504964221048455199> **(📢Update Script)** com esse cargo vc recebe um aviso de quando o script atualizar\n\n' +
        '<@&1504964041959931965> **(📢Annunciament Script)** com esse cargo vc recebera anunciamento sobre o script\n\n' +
        '<@&1504962681784766555> **(📢Lotux Hub Annunciament)** vc receberar anunciamento sobre o server ou ate o script\n\n' +
        '<@&1504962613480525905> **(⚽Chat Revive)** vc recebera uma mensagem no chat quando alguem quiser falar algo\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '**EN-US**\n' +
        '<@&1504964221048455199> **(📢Update Script)** with this role you get a notification when the script updates\n\n' +
        '<@&1504964041959931965> **(📢Annunciament Script)** with this role you will receive announcements about the script\n\n' +
        '<@&1504962681784766555> **(📢Lotux Hub Annunciament)** you will receive announcements about the server or even the script\n\n' +
        '<@&1504962613480525905> **(⚽Chat Revive)** you will receive a mention in the chat when someone wants to say something'
      )
      .setFooter({ text: 'Lotux Bot v1.0.0 • Clique para adicionar/remover o cargo' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      ...PING_ROLES.map(role =>
        new ButtonBuilder()
          .setCustomId(role.customId)
          .setLabel(role.label)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
