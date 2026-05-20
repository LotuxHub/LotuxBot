const { isCodeValid } = require('../utils/codeManager');
const { EmbedBuilder } = require('discord.js');

const UNVERIFIED_ROLE = '❌Unverified';
const VERIFIED_ROLE   = '✅Verified';
const MEMBER_ROLE_ID  = '1504852768563920936'; // 👥Membro

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const entry  = client.verificationCodes.get(userId);

    if (!entry) return;
    if (message.channelId !== entry.channelId) return;

    const inputCode = message.content.trim().toUpperCase();
    try { await message.delete(); } catch {}

    if (!isCodeValid(entry)) {
      client.verificationCodes.delete(userId);
      const reply = await message.channel.send({
        content: `${message.author} ❌ Seu código expirou. Use \`/verify\` novamente.`,
      });
      setTimeout(() => reply.delete().catch(() => {}), 8000);
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(inputCode)) return;

    if (inputCode !== entry.code) {
      const reply = await message.channel.send({
        content: `${message.author} ❌ Código incorreto! Verifique o código enviado no seu PV.`,
      });
      setTimeout(() => reply.delete().catch(() => {}), 6000);
      return;
    }

    // ✅ Código correto
    try {
      const guild  = message.guild;
      const member = await guild.members.fetch(userId);

      const unverifiedRole = guild.roles.cache.find(r => r.name === UNVERIFIED_ROLE);
      const verifiedRole   = guild.roles.cache.find(r => r.name === VERIFIED_ROLE);
      const memberRole     = guild.roles.cache.get(MEMBER_ROLE_ID);

      if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
        await member.roles.remove(unverifiedRole);
      }
      if (verifiedRole) await member.roles.add(verifiedRole);
      if (memberRole)   await member.roles.add(memberRole);

      client.verificationCodes.delete(userId);

      const successEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Verificado!')
        .setDescription(
          `${message.author} foi verificado com sucesso!\n` +
          `You have been successfully verified!`
        )
        .setTimestamp();

      const reply = await message.channel.send({ embeds: [successEmbed] });
      setTimeout(() => reply.delete().catch(() => {}), 10000);

    } catch (err) {
      console.error('[MSG VERIFY] Erro ao trocar cargos:', err);
      const reply = await message.channel.send({
        content: `${message.author} ✅ Código correto! Mas não consegui alterar seus cargos. Chame um admin.`,
      });
      setTimeout(() => reply.delete().catch(() => {}), 8000);
    }
  },
};
