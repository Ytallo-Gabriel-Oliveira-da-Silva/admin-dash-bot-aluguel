const express = require('express');
const { showPagamento, createPagamento } = require('./pagamentos.controller');

const pagamentoRoutes = express.Router();

pagamentoRoutes.get('/:token', showPagamento);
pagamentoRoutes.post('/:token', createPagamento);

module.exports = { pagamentoRoutes };
