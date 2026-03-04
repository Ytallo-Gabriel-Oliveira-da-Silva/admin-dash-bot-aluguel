const express = require('express');
const { authAdmin } = require('../../middleware/authAdmin');
const {
  showLogin,
  doLogin,
  dashboard,
  logout,
  updateContratoStatus,
  viewCliente,
  updateCliente,
  cancelarContrato
} = require('./admin.controller');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { createClienteAndContrato, listClientesJson } = require('../clientes/clientes.controller');

const adminRoutes = express.Router();

adminRoutes.get('/login', showLogin);
adminRoutes.post('/login', doLogin);

adminRoutes.get('/dashboard', authAdmin, dashboard);
adminRoutes.post('/logout', authAdmin, logout);

adminRoutes.post('/clientes', authAdmin, createClienteAndContrato);
adminRoutes.get('/clientes', authAdmin, asyncHandler(listClientesJson));
adminRoutes.get('/clientes/:clienteId', authAdmin, viewCliente);
adminRoutes.post('/clientes/:clienteId', authAdmin, updateCliente);
adminRoutes.post('/contratos/:contratoId/status', authAdmin, updateContratoStatus);
adminRoutes.post('/contratos/:contratoId/cancelar', authAdmin, cancelarContrato);

module.exports = { adminRoutes };
