const { prisma } = require('../config/database');
const { randomUUID } = require('crypto');
const { asaasClient, isAsaasConfigured } = require('../config/asaas');
const { updateContratoStatus } = require('./statusService');
const { audit } = require('./auditService');

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(startDate, endDate) {
  const ms = endDate.getTime() - startDate.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

async function createRenewalCharge(contrato) {
  const cliente = await prisma.cliente.findUnique({ where: { id: contrato.clienteId } });
  if (!cliente?.asaasCustomerId) {
    return;
  }

  const dueDate = addDays(new Date(), 30);
  let paymentId;
  if (isAsaasConfigured) {
    const response = await asaasClient.post('/v3/payments', {
      customer: cliente.asaasCustomerId,
      billingType: 'PIX',
      value: Number(contrato.valor),
      dueDate: dueDate.toISOString().slice(0, 10),
      description: `Renovação automática - Contrato ${contrato.id}`,
      externalReference: contrato.id
    });
    paymentId = response.data.id;
  } else {
    paymentId = `mock_renew_${randomUUID()}`;
  }

  await prisma.pagamento.create({
    data: {
      contratoId: contrato.id,
      asaasPaymentId: paymentId,
      tipo: 'pix',
      valor: contrato.valor,
      valorOriginal: contrato.valor,
      status: 'pendente',
      dataVencimento: dueDate
    }
  });

  await updateContratoStatus({
    contratoId: contrato.id,
    status: 'aguardando_pagamento',
    actor: 'system:renewal',
    metadata: { reason: 'renovacao_automatica' }
  });

  await prisma.contrato.update({
    where: { id: contrato.id },
    data: { dataVencimento: dueDate }
  });
}

async function applyLateFeesAndStatus() {
  const now = new Date();
  const pendentes = await prisma.pagamento.findMany({
    where: {
      status: 'pendente',
      dataVencimento: { not: null }
    },
    include: { contrato: true }
  });

  for (const pagamento of pendentes) {
    if (!pagamento.dataVencimento) continue;
    const diasAtraso = daysBetween(new Date(pagamento.dataVencimento), now);
    if (diasAtraso <= 0) continue;

    if (diasAtraso > 3) {
      const valorBase = Number(pagamento.valorOriginal || pagamento.valor);
      const multa = valorBase * 0.02;
      const juros = valorBase * (0.01 / 30) * diasAtraso;
      const novoValor = Number((valorBase + multa + juros).toFixed(2));

      try {
        if (isAsaasConfigured) {
          await asaasClient.put(`/v3/payments/${pagamento.asaasPaymentId}`, { value: novoValor });
        }
      } catch (error) {
        await audit({
          actor: 'system:billing',
          action: 'asaas_update_failed',
          entity: 'pagamento',
          entityId: pagamento.id,
          metadata: { message: error.message }
        });
      }

      await prisma.pagamento.update({
        where: { id: pagamento.id },
        data: {
          valor: novoValor,
          valorOriginal: valorBase,
          valorMulta: multa,
          valorJuros: juros
        }
      });
    }

    if (diasAtraso >= 7) {
      await updateContratoStatus({
        contratoId: pagamento.contratoId,
        status: 'suspenso',
        actor: 'system:billing',
        metadata: { diasAtraso }
      });
    }

    if (diasAtraso >= 30) {
      await updateContratoStatus({
        contratoId: pagamento.contratoId,
        status: 'cancelado',
        actor: 'system:billing',
        metadata: { diasAtraso }
      });
    }
  }
}

async function runDailyBillingCycle() {
  const now = new Date();
  const contratosRenovar = await prisma.contrato.findMany({
    where: {
      status: 'ativo',
      dataVencimento: { lte: now }
    }
  });

  for (const contrato of contratosRenovar) {
    await createRenewalCharge(contrato);
  }

  await applyLateFeesAndStatus();
}

module.exports = { runDailyBillingCycle };
