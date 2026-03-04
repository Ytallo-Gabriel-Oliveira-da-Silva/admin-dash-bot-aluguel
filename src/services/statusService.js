const { prisma } = require('../config/database');
const { audit } = require('./auditService');

async function updateContratoStatus({ contratoId, status, actor, metadata }) {
  const contrato = await prisma.contrato.update({
    where: { id: contratoId },
    data: { status }
  });

  await audit({
    actor: actor || 'system',
    action: 'contrato_status_update',
    entity: 'contrato',
    entityId: contratoId,
    metadata: {
      status,
      ...metadata
    }
  });

  return contrato;
}

module.exports = { updateContratoStatus };
