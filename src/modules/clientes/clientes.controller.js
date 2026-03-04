const { z } = require('zod');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { createClienteComContrato, listClientes } = require('./clientes.service');

const createClienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email()
});

const createClienteAndContrato = asyncHandler(async (req, res) => {
  const parsed = createClienteSchema.parse(req.body);

  const valor = Number(process.env.CONTRACT_VALUE_MONTHLY || 149);
  const tokenExpiryDays = Number(process.env.TOKEN_EXPIRY_DAYS || 7);
  const runtimeBaseUrl = `${req.protocol}://${req.get('host')}`;
  const baseUrl = process.env.APP_BASE_URL || runtimeBaseUrl;

  const { contrato } = await createClienteComContrato({
    ...parsed,
    valor,
    tokenExpiryDays,
    actor: req.admin?.email
  });

  if (req.originalUrl.startsWith('/admin')) {
    return res.redirect('/admin/dashboard');
  }

  return res.status(201).json({
    token: contrato.tokenUnico,
    link: `${baseUrl}/contrato/${contrato.tokenUnico}`
  });
});

const listClientesJson = asyncHandler(async (req, res) => {
  const clientes = await listClientes();
  res.json(clientes);
});

module.exports = { createClienteAndContrato, listClientesJson };
