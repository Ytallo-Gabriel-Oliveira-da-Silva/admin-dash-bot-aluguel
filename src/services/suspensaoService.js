const { prisma } = require('../config/database');
const { PAGAMENTO_STATUS } = require('../constants');
const { updateContratoStatus } = require('./statusService');

async function applyOverdueSuspension() {
  const now = new Date();

  await prisma.pagamento.updateMany({
    where: {
      status: PAGAMENTO_STATUS.PENDENTE,
      dataVencimento: { lt: now }
    },
    data: { status: PAGAMENTO_STATUS.VENCIDO }
  });

  const vencidos = await prisma.pagamento.findMany({
    where: { status: PAGAMENTO_STATUS.VENCIDO },
    select: { contratoId: true }
  });

  const contratoIds = [...new Set(vencidos.map((item) => item.contratoId))];

  if (contratoIds.length) {
    for (const contratoId of contratoIds) {
      await updateContratoStatus({
        contratoId,
        status: 'suspenso',
        actor: 'system:overdue',
        metadata: { reason: 'pagamento_vencido' }
      });
    }
  }

  return { contratosSuspensos: contratoIds.length };
}

module.exports = { applyOverdueSuspension };
