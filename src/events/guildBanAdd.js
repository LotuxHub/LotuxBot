const { EmbedBuilder, AuditLogEvent } = require('discord.js');

const LOG_BAN_CHANNEL = '1504857660699185182';

module.exports = {
  name: 'guildBanAdd',

  async execute(ban, client) {
    try {
      const logChannel = ban.guild.channels.cache.get(LOG_BAN_CHANNEL);
      if (!logChannel) return;

      // Tenta buscar o motivo e quem baniu pelo Audit Log
      let executor = null;
      let motivo   = ban.reason || 'Sem motivo informado';

      try {
        // Precisa da permissão VIEW_AUDIT_LOG no bot
        const auditLogs = await ban.guild.fetchAuditLogs({
          limit: 1,
          type:  AuditLogEvent.MemberBanAdd,
        });
        const entry = auditLogs.entries.first();
        if (entry && entry.target?.id === ban.user.id) {
          executor = entry.executor;
          if (entry.reason) motivo = entry.reason;
        }
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(0x991b1b)
        .setTitle('🔨 Membro Banido')
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 128 }))
        .setDescription(`${ban.user} foi banido do servidor.`)
        .addFields(
          { name: '👤 Usuário', value: `${ban.user.tag}`,          inline: true },
          { name: '🆔 ID',      value: ban.user.id,                 inline: true },
          { name: '🛡️ Por',    value: executor?.tag ?? 'Desconhecido', inline: true },
          { name: '📋 Motivo',  value: motivo },
        )
        .setFooter({ text: 'Lotux Bot • Log de Ban' })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[BAN LOG]', err);
    }
  },
};
