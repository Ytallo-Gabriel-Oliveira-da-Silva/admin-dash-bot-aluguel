const express = require('express');
const { authAdmin } = require('../../middleware/authAdmin');
const { createClienteAndContrato, listClientesJson } = require('./clientes.controller');

const clienteRoutes = express.Router();

clienteRoutes.post('/', authAdmin, createClienteAndContrato);
clienteRoutes.get('/', authAdmin, listClientesJson);

module.exports = { clienteRoutes };
