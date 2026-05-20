const { EmbedBuilder } = require('discord.js');

const LOG_JOIN_CHANNEL = '1504857110649897191';

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    // ── Dar cargo ❌Unverified ──────────────────────────────────────
    try {
      const unverifiedRole = member.guild.roles.cache.find(
        r => r.name === '❌Unverified' || r.name.toLowerCase().includes('unverified')
      );

      if (!unverifiedRole) {
        console.warn(`[JOIN] Cargo ❌Unverified não encontrado no servidor ${member.guild.name}`);
      } else {
        await member.roles.add(unverifiedRole);
        console.log(`[JOIN] ${member.user.tag} recebeu cargo ${unverifiedRole.name}`);
      }
    } catch (err) {
      console.error(`[JOIN] Erro ao dar cargo para ${member.user.tag}:`, err);
    }

    // ── Log no canal de entrada ────────────────────────────────────
    try {
      const logChannel = member.guild.channels.cache.get(LOG_JOIN_CHANNEL);
      if (!logChannel) return;

      const memberCount = member.guild.memberCount;

      const embed = new EmbedBuilder()
        .setColor(0x4ade80)
        .setTitle('📥 Novo Membro Entrou')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`${member.user} entrou no servidor!`)
        .addFields(
          { name: '👤 Usuário',      value: `${member.user.tag}`,                                       inline: true },
          { name: '🆔 ID',           value: member.user.id,                                              inline: true },
          { name: '📅 Conta criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Total',        value: `${memberCount} membros`,                                    inline: true },
        )
        .setFooter({ text: 'Lotux Bot • Log de Entrada' })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[JOIN LOG]', err);
    }
  },
};
