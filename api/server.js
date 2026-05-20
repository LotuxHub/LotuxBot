const express = require('express');
const cors = require('cors');
const path = require('path');

const verifyRoutes = require('./routes/verify');
const statusRoutes = require('./routes/status');

function startAPI(client) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Passar client do Discord para as rotas
  app.use((req, res, next) => {
    req.discordClient = client;
    next();
  });

  // Rotas
  app.use('/api/verify', verifyRoutes);
  app.use('/api/status', statusRoutes);

  // Rota raiz → dashboard simples
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  app.listen(PORT, () => {
    console.log(`\n🌐 API rodando em http://localhost:${PORT}`);
  });
}

module.exports = { startAPI };
