const express = require('express');
const {
  showContratoByToken,
  submitAssinatura,
  viewContrato,
  contratoStatus,
  showStatusPage,
  downloadContratoPdf
} = require('./contratos.controller');

const contratoRoutes = express.Router();

contratoRoutes.get('/status/:token', showStatusPage);
contratoRoutes.get('/:token', showContratoByToken);
contratoRoutes.post('/:token/assinar', submitAssinatura);
contratoRoutes.get('/:token/visualizar', viewContrato);
contratoRoutes.get('/:token/pdf', downloadContratoPdf);
contratoRoutes.get('/:token/status', contratoStatus);

module.exports = { contratoRoutes };
