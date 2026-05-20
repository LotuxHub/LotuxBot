const express = require('express');
const router = express.Router();

// GET /api/status
router.get('/', (req, res) => {
  const client = req.discordClient;
  res.json({
    status: 'online',
    bot: client.user?.tag || 'não conectado',
    uptime: Math.floor(process.uptime()),
    guilds: client.guilds?.cache?.size || 0,
    pendingVerifications: client.verificationCodes?.size || 0,
    version: '1.0.0',
  });
});

module.exports = router;
