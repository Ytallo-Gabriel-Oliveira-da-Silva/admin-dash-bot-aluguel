const crypto = require('crypto');

function validateWebhook(req, res, next) {
  const secret = process.env.ASAAS_WEBHOOK_SECRET;

  if (!secret) {
    return next();
  }

  const providedToken = req.headers['asaas-access-token'] || req.headers['x-asaas-access-token'];
  if (providedToken && providedToken === secret) {
    return next();
  }

  const provided = req.headers['x-asaas-signature'] || req.headers['asaas-signature'];
  if (!provided) {
    return res.status(401).json({ error: 'Assinatura do webhook ausente.' });
  }

  const bodyRaw = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(bodyRaw).digest('hex');

  if (provided !== expected) {
    return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
  }

  return next();
}

module.exports = { validateWebhook };
