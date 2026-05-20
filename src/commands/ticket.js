const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');

// Cargos que podem ver tickets
const STAFF_ROLE_IDS = [
  '1504850593678757969',
  '1504858498985627828',
  '1504860250925170818',
  '1506714071695757484',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Abre um ticket de suporte privado com a staff')
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo do ticket (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const motivo = interaction.options.getString('motivo') || 'Sem motivo informado';
    const guild  = interaction.guild;
    const user   = interaction.user;

    // Verifica se o usuário já tem um ticket aberto
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${user.username.toLowerCase().replace(/\s/g, '-')}`
    );
    if (existing) {
      await interaction.reply({
        content: `❌ Você já tem um ticket aberto: ${existing}`,
        ephemeral: true,
      });
      return;
    }

    // Monta as permissões do canal
    const permissionOverwrites = [
      {
        // Nega acesso a @everyone
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        // Permite ao usuário que abriu
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ];

    // Permite a cada cargo de staff
    for (const roleId of STAFF_ROLE_IDS) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        permissionOverwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageMessages,
          ],
        });
      }
    }

    // Cria o canal
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username.toLowerCase().replace(/\s/g, '-')}`,
      type: ChannelType.GuildText,
      topic: `Ticket de ${user.tag} | Motivo: ${motivo}`,
      permissionOverwrites,
    });

    // Embed dentro do ticket
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎫 Ticket de Suporte')
      .setDescription(
        `Olá ${user}! A staff foi notificada e irá te atender em breve.\n\n` +
        `**Motivo:** ${motivo}\n\n` +
        `Quando o problema for resolvido, clique em **Fechar Ticket** abaixo.`
      )
      .setFooter({ text: `Lotux Hub • Ticket aberto por ${user.tag}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close_ticket_${user.id}`)
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger),
    );

    await ticketChannel.send({ content: `${user} ${STAFF_ROLE_IDS.map(id => `<@&${id}>`).join(' ')}`, embeds: [embed], components: [row] });

    await interaction.reply({
      content: `✅ Seu ticket foi aberto: ${ticketChannel}`,
      ephemeral: true,
    });
  },
};
