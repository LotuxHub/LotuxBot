module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`🤖 Logado como: ${client.user.tag}`);
    client.user.setActivity('Verificando membros...', { type: 3 }); // WATCHING
  },
};
