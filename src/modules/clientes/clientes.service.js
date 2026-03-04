const { prisma } = require('../../config/database');
const { createContratoForCliente } = require('../../services/contratoService');
const { audit } = require('../../services/auditService');

async function createClienteComContrato({ nome, email, valor, tokenExpiryDays, actor }) {
  const cliente = await prisma.cliente.create({
    data: { nome, email }
  });

  const contrato = await createContratoForCliente({
    clienteId: cliente.id,
    valor,
    tokenExpiryDays
  });

  await audit({
    actor: actor || 'admin',
    action: 'cliente_contrato_criado',
    entity: 'cliente',
    entityId: cliente.id,
    metadata: { contratoId: contrato.id }
  });

  return { cliente, contrato };
}

async function listClientes() {
  return prisma.cliente.findMany({
    include: { contratos: true },
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = {
  createClienteComContrato,
  listClientes
};
