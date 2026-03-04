const { prisma } = require('../config/database');
const { PAGAMENTO_STATUS } = require('../constants');
const { addDays } = require('../utils/requestMeta');
const { updateContratoStatus } = require('./statusService');
const { generateContratoPdf } = require('./pdfService');

async function processAsaasWebhook(payload) {
  const eventId = payload?.id || `${payload?.event}_${payload?.payment?.id}`;
  const eventType = payload?.event;

  if (!eventType || !payload?.payment?.id) {
    return { ignored: true, reason: 'Payload inválido.' };
  }

  const exists = await prisma.webhookEvent.findUnique({
    where: { asaasEventId: eventId }
  });

  if (exists) {
    return { ignored: true, reason: 'Evento já processado.' };
  }

  await prisma.webhookEvent.create({
    data: {
      asaasEventId: eventId,
      eventType,
      payload
    }
  });

  if (eventType !== 'PAYMENT_CONFIRMED') {
    return { ignored: true, reason: 'Evento não mapeado para ativação.' };
  }

  const asaasPaymentId = payload.payment.id;
  const pagamento = await prisma.pagamento.findUnique({
    where: { asaasPaymentId },
    include: { contrato: true }
  });

  if (!pagamento) {
    return { ignored: true, reason: 'Pagamento não encontrado.' };
  }

  const dataAtivacao = new Date();
  const dataVencimento = addDays(dataAtivacao, 30);

  await prisma.$transaction([
    prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        status: PAGAMENTO_STATUS.CONFIRMADO,
        dataConfirmacao: dataAtivacao
      }
    }),
    prisma.contrato.update({
      where: { id: pagamento.contratoId },
      data: {
        dataAtivacao,
        dataVencimento
      }
    })
  ]);

  await updateContratoStatus({
    contratoId: pagamento.contratoId,
    status: 'ativo',
    actor: 'webhook:asaas',
    metadata: { paymentId: pagamento.id }
  });

  const contratoAtualizado = await prisma.contrato.findUnique({
    where: { id: pagamento.contratoId }
  });
  if (contratoAtualizado) {
    await generateContratoPdf(contratoAtualizado);
  }

  return { processed: true };
}

module.exports = { processAsaasWebhook };
