const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regras')
    .setDescription('Envia as regras do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // só admins

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📋 Regras do Servidor — Lotux Hub')
      .setDescription(
        '> Leia com atenção antes de participar. O desrespeito às regras resultará em punição.\n' +
        '> Read carefully before participating. Failure to follow the rules will result in punishment.\n'
      )
      .addFields(
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '🇧🇷 **PORTUGUÊS**',
        },
        {
          name: '§1 · Respeito',
          value: 'Trate todos com respeito. Não serão tolerados xingamentos, provocações, discriminação ou qualquer forma de assédio.',
        },
        {
          name: '§2 · Spam & Flood',
          value: 'Proibido enviar mensagens repetidas, floods, caps lock excessivo ou menções desnecessárias (@everyone, @here).',
        },
        {
          name: '§3 · Conteúdo Impróprio',
          value: 'É proibido compartilhar conteúdo NSFW, violento, ilegal ou que viole os Termos de Serviço do Discord.',
        },
        {
          name: '§4 · Scripts & Projetos',
          value: 'Não distribua scripts crackeados, vazados ou de terceiros sem autorização. Respeite a autoria dos projetos.',
        },
        {
          name: '§5 · Divulgação',
          value: 'Proibido divulgar outros servidores, produtos ou serviços sem autorização da staff.',
        },
        {
          name: '§6 · Canais',
          value: 'Use cada canal para o seu propósito. Leia a descrição do canal antes de enviar mensagens.',
        },
        {
          name: '§7 · Staff',
          value: 'Respeite as decisões da equipe. Em caso de discordância, abra um ticket. Não discuta punições em público.',
        },
        {
          name: '§8 · Nomes & Avatares',
          value: 'Nomes e avatares ofensivos, com caracteres especiais que dificultem menções ou que imitem a staff são proibidos.',
        },
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '🇺🇸 **ENGLISH**',
        },
        {
          name: '§1 · Respect',
          value: 'Treat everyone with respect. Insults, provocation, discrimination or any form of harassment will not be tolerated.',
        },
        {
          name: '§2 · Spam & Flood',
          value: 'Sending repeated messages, floods, excessive caps lock or unnecessary mentions (@everyone, @here) is prohibited.',
        },
        {
          name: '§3 · Inappropriate Content',
          value: 'Sharing NSFW, violent, illegal content or anything that violates Discord\'s Terms of Service is strictly forbidden.',
        },
        {
          name: '§4 · Scripts & Projects',
          value: 'Do not distribute cracked, leaked or third-party scripts without authorization. Respect the authorship of all projects.',
        },
        {
          name: '§5 · Advertising',
          value: 'Advertising other servers, products or services without staff authorization is prohibited.',
        },
        {
          name: '§6 · Channels',
          value: 'Use each channel for its intended purpose. Read the channel description before sending messages.',
        },
        {
          name: '§7 · Staff',
          value: 'Respect the team\'s decisions. If you disagree, open a ticket. Do not discuss punishments publicly.',
        },
        {
          name: '§8 · Names & Avatars',
          value: 'Offensive usernames, avatars, names with special characters that make mentions difficult, or names that impersonate staff are prohibited.',
        },
      )
      .setFooter({ text: 'Lotux Hub • Ao entrar no servidor você concorda com as regras acima.' })
      .setTimestamp();

    await interaction.reply({ content: '✅ Regras enviadas!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
  },
};