require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const { startAPI } = require('../api/server');

// ==========================================
//   LOTUX BOT v1.0.0
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,       // necessário para guildMemberAdd/Remove
    GatewayIntentBits.GuildModeration,    // necessário para guildBanAdd
    GatewayIntentBits.GuildMessages,      // necessário para messageCreate
    GatewayIntentBits.MessageContent,     // necessário para ler conteúdo da msg
    GatewayIntentBits.DirectMessages,     // necessário para enviar DM
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands          = new Collection();
client.verificationCodes = new Map(); // userId -> { code, guildId, channelId, expiresAt }

// Carregar comandos
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`[CMD] /${command.data.name} carregado`);
  }
}

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`[EVT] Evento "${event.name}" carregado`);
}

// Iniciar API REST
startAPI(client);

// Login
client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log('\n✅ Lotux Bot v1.0.0 online!');
}).catch(err => {
  console.error('❌ Erro ao fazer login:', err);
  process.exit(1);
});
