const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  AuditLogEvent,
} = require('discord.js');

// Importa o Map de warns do warn.js
let warnings;
try {
  warnings = require('./warn').warnings;
} catch {
  warnings = new Map();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Mostra o histórico de punições de um membro')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('membro')
        .setDescription('Membro a consultar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membro');

    await interaction.deferReply({ ephemeral: true });

    const lines = [];

    // ── Warns ─────────────────────────────────────────────────────
    const warnList = warnings.get(target.id) || [];
    if (warnList.length > 0) {
      lines.push('**⚠️ Advertências**');
      warnList.forEach((w, i) => {
        lines.push(`> **#${i + 1}** ${w.motivo} — por ${w.por} em ${w.data}`);
      });
      lines.push('');
    }

    // ── Audit Log: Timeouts ───────────────────────────────────────
    try {
      const muteLogs = await interaction.guild.fetchAuditLogs({
        type:  AuditLogEvent.MemberUpdate,
        limit: 50,
      });

      const muteEntries = muteLogs.entries.filter(e =>
        e.target?.id === target.id &&
        e.changes?.some(c => c.key === 'communication_disabled_until')
      );

      if (muteEntries.size > 0) {
        lines.push('**🔇 Mutes (Timeout)**');
        muteEntries.forEach(e => {
          const ts   = Math.floor(e.createdTimestamp / 1000);
          const por  = e.executor?.tag ?? 'Desconhecido';
          const mot  = e.reason ?? 'Sem motivo';
          lines.push(`> <t:${ts}:d> — ${mot} — por ${por}`);
        });
        lines.push('');
      }
    } catch {}

    // ── Audit Log: Kicks ──────────────────────────────────────────
    try {
      const kickLogs = await interaction.guild.fetchAuditLogs({
        type:  AuditLogEvent.MemberKick,
        limit: 50,
      });

      const kickEntries = kickLogs.entries.filter(e => e.target?.id === target.id);

      if (kickEntries.size > 0) {
        lines.push('**👢 Kicks**');
        kickEntries.forEach(e => {
          const ts  = Math.floor(e.createdTimestamp / 1000);
          const por = e.executor?.tag ?? 'Desconhecido';
          const mot = e.reason ?? 'Sem motivo';
          lines.push(`> <t:${ts}:d> — ${mot} — por ${por}`);
        });
        lines.push('');
      }
    } catch {}

    // ── Audit Log: Bans ───────────────────────────────────────────
    try {
      const banLogs = await interaction.guild.fetchAuditLogs({
        type:  AuditLogEvent.MemberBanAdd,
        limit: 50,
      });

      const banEntries = banLogs.entries.filter(e => e.target?.id === target.id);

      if (banEntries.size > 0) {
        lines.push('**🔨 Bans**');
        banEntries.forEach(e => {
          const ts  = Math.floor(e.createdTimestamp / 1000);
          const por = e.executor?.tag ?? 'Desconhecido';
          const mot = e.reason ?? 'Sem motivo';
          lines.push(`> <t:${ts}:d> — ${mot} — por ${por}`);
        });
        lines.push('');
      }
    } catch {}

    // ── Resultado ─────────────────────────────────────────────────
    if (lines.length === 0) {
      return interaction.editReply({ content: `✅ ${target.tag} não possui nenhum histórico de punições.` });
    }

    const description = lines.join('\n');
    const chunks = [];
    // Divide em chunks de 4000 chars caso seja muito longo
    let current = '';
    for (const line of lines) {
      if ((current + '\n' + line).length > 4000) {
        chunks.push(current);
        current = line;
      } else {
        current += (current ? '\n' : '') + line;
      }
    }
    if (current) chunks.push(current);

    const embeds = chunks.map((chunk, i) =>
      new EmbedBuilder()
        .setColor(0xf97316)
        .setTitle(i === 0 ? `📋 Histórico de ${target.tag}` : `📋 Histórico de ${target.tag} (cont.)`)
        .setDescription(chunk)
        .setThumbnail(target.displayAvatarURL())
        .setFooter({ text: `ID: ${target.id} • Lotux Bot` })
        .setTimestamp()
    );

    await interaction.editReply({ embeds: embeds.slice(0, 10) }); // Discord máx 10 embeds
  },
};
