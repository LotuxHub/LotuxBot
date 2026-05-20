const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

// Salva config em JSON por guild
const CONFIG_PATH = path.join(__dirname, '../../data/autorole.json');

function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveConfig(data) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Gerencia cargos dados automaticamente a novos membros')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona um cargo à lista de autorole')
        .addRoleOption(opt =>
          opt.setName('cargo')
            .setDescription('Cargo a ser dado automaticamente')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove um cargo da lista de autorole')
        .addRoleOption(opt =>
          opt.setName('cargo')
            .setDescription('Cargo a remover')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lista os cargos de autorole configurados')
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Remove todos os cargos de autorole')
    ),

  async execute(interaction) {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const config  = loadConfig();

    if (!config[guildId]) config[guildId] = [];

    // ── ADD ──────────────────────────────────────────────────────
    if (sub === 'add') {
      const role = interaction.options.getRole('cargo');

      // Verifica se o bot consegue dar esse cargo
      const botMember = interaction.guild.members.me;
      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `❌ Não consigo dar o cargo **${role.name}** — ele está acima ou igual ao meu cargo na hierarquia.`,
          ephemeral: true,
        });
      }

      if (config[guildId].includes(role.id)) {
        return interaction.reply({
          content: `❌ O cargo **${role.name}** já está na lista de autorole.`,
          ephemeral: true,
        });
      }

      config[guildId].push(role.id);
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(0x4ade80)
        .setTitle('✅ Autorole Adicionado')
        .setDescription(`O cargo ${role} será dado automaticamente a todos os novos membros.`)
        .addFields({ name: 'Total de autoroles', value: `${config[guildId].length}`, inline: true })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ── REMOVE ───────────────────────────────────────────────────
    if (sub === 'remove') {
      const role = interaction.options.getRole('cargo');

      if (!config[guildId].includes(role.id)) {
        return interaction.reply({
          content: `❌ O cargo **${role.name}** não está na lista de autorole.`,
          ephemeral: true,
        });
      }

      config[guildId] = config[guildId].filter(id => id !== role.id);
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(0xf87171)
        .setTitle('🗑️ Autorole Removido')
        .setDescription(`O cargo ${role} foi removido da lista de autorole.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ── LIST ─────────────────────────────────────────────────────
    if (sub === 'list') {
      const list = config[guildId];

      if (list.length === 0) {
        return interaction.reply({
          content: '📋 Nenhum autorole configurado. Use `/autorole add` para adicionar.',
          ephemeral: true,
        });
      }

      const roles = list
        .map(id => {
          const role = interaction.guild.roles.cache.get(id);
          return role ? `• ${role} — \`${id}\`` : `• ~~${id}~~ (cargo deletado)`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📋 Autoroles Configurados')
        .setDescription(roles)
        .addFields({ name: 'Total', value: `${list.length} cargo(s)`, inline: true })
        .setFooter({ text: 'Esses cargos são dados a todo novo membro que entra' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── CLEAR ────────────────────────────────────────────────────
    if (sub === 'clear') {
      const total = config[guildId].length;
      config[guildId] = [];
      saveConfig(config);

      return interaction.reply({
        content: `✅ ${total} autorole(s) removido(s). Novos membros não receberão cargos automáticos (exceto o ❌Unverified padrão).`,
        ephemeral: true,
      });
    }
  },

  // Exporta função para o guildMemberAdd usar
  getAutoRoles(guildId) {
    const config = loadConfig();
    return config[guildId] || [];
  },
};
