const express = require('express');
const router  = express.Router();
const { isCodeValid } = require('../../src/utils/codeManager');

// ── Middleware: verifica API_SECRET ────────────────────────────────
function requireSecret(req, res, next) {
  if (req.headers['x-api-secret'] !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// ── POST /api/verify/validate ──────────────────────────────────────
// Body: { userId: "123", code: "A3F9B2" }
// Valida o código e, se correto, troca os cargos via Discord.js
router.post('/validate', requireSecret, async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ error: 'userId e code são obrigatórios' });
  }

  const client = req.discordClient;
  const entry  = client.verificationCodes.get(userId);

  if (!entry || !isCodeValid(entry)) {
    client.verificationCodes.delete(userId);
    return res.status(410).json({ error: 'Código expirado ou não encontrado' });
  }

  if (code.trim().toUpperCase() !== entry.code) {
    return res.status(400).json({ error: 'Código incorreto' });
  }

  // ✅ Código correto — trocar cargos
  try {
    const guild  = await client.guilds.fetch(entry.guildId);
    const member = await guild.members.fetch(userId);

    const unverifiedRole = guild.roles.cache.find(r => r.name === '❌Unverified');
    const verifiedRole   = guild.roles.cache.find(r => r.name === '✅Verified');

    if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
      await member.roles.remove(unverifiedRole);
    }
    if (verifiedRole) {
      await member.roles.add(verifiedRole);
    }

    client.verificationCodes.delete(userId);

    return res.json({
      success: true,
      message: `${member.user.tag} verificado com sucesso!`,
      userId,
      guildId: entry.guildId,
    });

  } catch (err) {
    console.error('[API VERIFY] Erro ao trocar cargos:', err);
    return res.status(500).json({ error: 'Erro interno ao atribuir cargos', detail: err.message });
  }
});

// ── GET /api/verify/pending ────────────────────────────────────────
router.get('/pending', requireSecret, (req, res) => {
  const client  = req.discordClient;
  const pending = [];

  for (const [userId, entry] of client.verificationCodes.entries()) {
    if (Date.now() < entry.expiresAt) {
      pending.push({
        userId,
        guildId:   entry.guildId,
        guildName: entry.guildName,
        expiresAt: new Date(entry.expiresAt).toISOString(),
      });
    } else {
      client.verificationCodes.delete(userId);
    }
  }

  res.json({ count: pending.length, pending });
});

module.exports = router;
