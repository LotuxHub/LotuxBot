const crypto = require('crypto');

/**
 * Gera um código de verificação aleatório de 6 caracteres
 */
function generateCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // ex: A3F9B2
}

/**
 * Verifica se um código ainda é válido (expira em 10 minutos)
 */
function isCodeValid(entry) {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

module.exports = { generateCode, isCodeValid };
