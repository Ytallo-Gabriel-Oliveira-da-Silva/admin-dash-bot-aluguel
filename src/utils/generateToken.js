const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(48).toString('hex');
}

module.exports = { generateToken };
