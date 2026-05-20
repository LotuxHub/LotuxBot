const { EmbedBuilder } = require('discord.js');

const LOG_LEAVE_CHANNEL = '1504857501261103134';

module.exports = {
  name: 'guildMemberRemove',

  async execute(member, client) {
    try {
      const logChannel = member.guild.channels.cache.get(LOG_LEAVE_CHANNEL);
      if (!logChannel) return;

      const roles = member.roles.cache
        .filter(r => r.id !== member.guild.roles.everyone.id)
        .map(r => `${r}`)
        .join(', ') || 'Nenhum';

      const memberCount = member.guild.memberCount;

      const embed = new EmbedBuilder()
        .setColor(0xf87171)
        .setTitle('📤 Membro Saiu')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`${member.user} saiu do servidor.`)
        .addFields(
          { name: '👤 Usuário',     value: `${member.user.tag}`,                                       inline: true },
          { name: '🆔 ID',          value: member.user.id,                                              inline: true },
          { name: '📅 Entrou em',   value: member.joinedAt
              ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
              : 'Desconhecido',                                                                          inline: true },
          { name: '👥 Total',       value: `${memberCount} membros`,                                    inline: true },
          { name: '🎭 Cargos',      value: roles.length > 1024 ? roles.slice(0, 1021) + '...' : roles },
        )
        .setFooter({ text: 'Lotux Bot • Log de Saída' })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[LEAVE LOG]', err);
    }
  },
};
