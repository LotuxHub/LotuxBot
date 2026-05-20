const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');

// Map para guardar votos: pollId -> { sim: Set<userId>, nao: Set<userId>, talvez: Set<userId> }
const pollVotes = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Cria uma enquete com botões de votação')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('pergunta')
        .setDescription('A pergunta da enquete')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('opcao1')
        .setDescription('Primeira opção (padrão: Sim)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('opcao2')
        .setDescription('Segunda opção (padrão: Não)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('opcao3')
        .setDescription('Terceira opção (padrão: Talvez)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('mencionar')
        .setDescription('Cargo para mencionar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const pergunta  = interaction.options.getString('pergunta');
    const op1       = interaction.options.getString('opcao1')   || '✅ Sim';
    const op2       = interaction.options.getString('opcao2')   || '❌ Não';
    const op3       = interaction.options.getString('opcao3')   || null;
    const mencionar = interaction.options.getString('mencionar') || null;

    const pollId = `poll_${Date.now()}`;
    pollVotes.set(pollId, {
      [op1]: new Set(),
      [op2]: new Set(),
      ...(op3 ? { [op3]: new Set() } : {}),
    });

    const embed = buildPollEmbed(pergunta, pollVotes.get(pollId), interaction.user);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${pollId}_0`)
        .setLabel(op1)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`${pollId}_1`)
        .setLabel(op2)
        .setStyle(ButtonStyle.Danger),
      ...(op3 ? [new ButtonBuilder()
        .setCustomId(`${pollId}_2`)
        .setLabel(op3)
        .setStyle(ButtonStyle.Secondary)] : []),
    );

    await interaction.reply({ content: '✅ Enquete criada!', ephemeral: true });
    const msg = await interaction.channel.send({
      content: mencionar ?? undefined,
      embeds: [embed],
      components: [row],
    });

    // Salva a mensagem e opções para o handler de botões
    pollVotes.get(pollId)._messageId  = msg.id;
    pollVotes.get(pollId)._channelId  = msg.channelId;
    pollVotes.get(pollId)._pergunta   = pergunta;
    pollVotes.get(pollId)._author     = interaction.user;
    pollVotes.get(pollId)._options    = op3 ? [op1, op2, op3] : [op1, op2];

    // Registra o handler no client
    if (!client._pollVotes) client._pollVotes = pollVotes;
  },
};

function buildPollEmbed(pergunta, data, author) {
  const options = data._options || Object.keys(data).filter(k => !k.startsWith('_'));
  const total   = options.reduce((acc, op) => acc + (data[op]?.size || 0), 0);

  const lines = options.map(op => {
    const count   = data[op]?.size || 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const bar     = '█'.repeat(Math.round(percent / 10)) + '░'.repeat(10 - Math.round(percent / 10));
    return `**${op}**\n\`${bar}\` ${percent}% — ${count} voto(s)`;
  });

  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📊 ${pergunta}`)
    .setDescription(lines.join('\n\n'))
    .addFields({ name: 'Total de votos', value: `${total}`, inline: true })
    .setFooter({ text: `Enquete criada por ${author?.tag || 'Lotux Hub'}` })
    .setTimestamp();
}

module.exports.pollVotes       = pollVotes;
module.exports.buildPollEmbed  = buildPollEmbed;
