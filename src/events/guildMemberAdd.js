module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    try {
      // Procura cargo ❌Unverified (pelo nome exato ou sem emoji)
      const unverifiedRole = member.guild.roles.cache.find(
        r =>
          r.name === '❌Unverified' ||
          r.name.toLowerCase().includes('unverified')
      );

      if (!unverifiedRole) {
        console.warn(`[JOIN] Cargo ❌Unverified não encontrado no servidor ${member.guild.name}`);
        return;
      }

      await member.roles.add(unverifiedRole);
      console.log(`[JOIN] ${member.user.tag} recebeu cargo ${unverifiedRole.name}`);
    } catch (err) {
      console.error(`[JOIN] Erro ao dar cargo para ${member.user.tag}:`, err);
    }
  },
};
