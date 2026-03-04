const express = require('express');

const { adminRoutes } = require('./modules/admin/admin.routes');
const { clienteRoutes } = require('./modules/clientes/clientes.routes');
const { contratoRoutes } = require('./modules/contratos/contratos.routes');
const { pagamentoRoutes } = require('./modules/pagamentos/pagamentos.routes');
const { webhookAsaas } = require('./modules/pagamentos/pagamentos.controller');
const { validateWebhook } = require('./middleware/validateWebhook');

function registerRoutes(app) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.use('/admin', adminRoutes);
  router.use('/api/clientes', clienteRoutes);
  router.use('/contrato', contratoRoutes);
  router.use('/pagamento', pagamentoRoutes);
  router.post('/webhook/asaas', validateWebhook, webhookAsaas);
  router.get('/status/:token', (req, res) => {
    res.redirect(`/contrato/status/${req.params.token}`);
  });

  router.get('/', (req, res) => {
    res.redirect('/admin/login');
  });

  app.use(router);
}

module.exports = { registerRoutes };
