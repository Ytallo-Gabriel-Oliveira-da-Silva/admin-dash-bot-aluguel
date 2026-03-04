const { prisma } = require('../config/database');
const { asaasClient, isAsaasConfigured } = require('../config/asaas');
const { CONTRATO_STATUS, PAGAMENTO_STATUS } = require('../constants');
const { updateContratoStatus } = require('./statusService');

function mapBillingType(tipo) {
  if (tipo === 'pix') return 'PIX';
  if (tipo === 'cartao_credito') return 'CREDIT_CARD';
  if (tipo === 'debito') return 'DEBIT_CARD';
  throw new Error('Tipo de pagamento inválido.');
}

async function ensureAsaasCustomer(cliente) {
  if (!isAsaasConfigured) {
    throw new Error('Credenciais Asaas não configuradas. Defina ASAAS_API_KEY e ASAAS_WEBHOOK_SECRET no .env.');
  }

  if (cliente.asaasCustomerId) {
    return cliente.asaasCustomerId;
  }

  const response = await asaasClient.post('/v3/customers', {
    name: cliente.nome,
    email: cliente.email,
    externalReference: cliente.id
  });

  const asaasCustomerId = response.data?.id;
  if (!asaasCustomerId) {
    throw new Error('Não foi possível criar cliente no Asaas.');
  }

  await prisma.cliente.update({
    where: { id: cliente.id },
    data: { asaasCustomerId }
  });

  return asaasCustomerId;
}

async function createAsaasPayment({
  contrato,
  tipo,
  installments = 1,
  creditCard,
  creditCardHolderInfo,
  remoteIp,
  dueDate
}) {
  const billingType = mapBillingType(tipo);
  const asaasCustomerId = await ensureAsaasCustomer(contrato.cliente);
  const due = dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000);

  const payload = {
    customer: asaasCustomerId,
    billingType,
    value: Number(contrato.valor),
    dueDate: due.toISOString().slice(0, 10),
    description: `Licenciamento mensal Bot White-Label - Contrato ${contrato.id}`,
    externalReference: contrato.id
  };

  if (billingType === 'CREDIT_CARD') {
    payload.installmentCount = Math.min(Math.max(Number(installments) || 1, 1), 3);
    if (creditCard) payload.creditCard = creditCard;
    if (creditCardHolderInfo) payload.creditCardHolderInfo = creditCardHolderInfo;
    if (remoteIp) payload.remoteIp = remoteIp;
  }

  if (billingType === 'DEBIT_CARD') {
    if (creditCard) payload.creditCard = creditCard;
    if (creditCardHolderInfo) payload.creditCardHolderInfo = creditCardHolderInfo;
    if (remoteIp) payload.remoteIp = remoteIp;
  }

  const response = await asaasClient.post('/v3/payments', payload);
  const data = response.data;

  let pixQr = null;
  if (billingType === 'PIX' && data?.id) {
    try {
      const pixResponse = await asaasClient.get(`/v3/payments/${data.id}/pixQrCode`);
      pixQr = pixResponse.data;
    } catch (error) {
      pixQr = null;
    }
  }

  const pagamento = await prisma.pagamento.create({
    data: {
      contratoId: contrato.id,
      asaasPaymentId: data.id,
      tipo,
      valor: contrato.valor,
      valorOriginal: contrato.valor,
      status: PAGAMENTO_STATUS.PENDENTE,
      dataVencimento: data.dueDate ? new Date(data.dueDate) : null
    }
  });

  await prisma.contrato.update({
    where: { id: contrato.id },
    data: {
      metodoPagamento: tipo
    }
  });

  if (contrato.status !== CONTRATO_STATUS.AGUARDANDO_PAGAMENTO) {
    await updateContratoStatus({
      contratoId: contrato.id,
      status: CONTRATO_STATUS.AGUARDANDO_PAGAMENTO,
      actor: 'system:payment',
      metadata: { reason: 'cobranca_gerada' }
    });
  }

  return {
    pagamento,
    asaas: {
      id: data.id,
      invoiceUrl: data.invoiceUrl,
      pixQrCode: pixQr?.encodedImage || data.encodedImage || data.pixQrCode?.encodedImage || null,
      pixPayload: pixQr?.payload || data.payload || data.pixQrCode?.payload || null,
      expirationDate: pixQr?.expirationDate || due.toISOString(),
      status: data.status || null
    }
  };
}

async function getLatestPagamentoByContrato(contratoId) {
  return prisma.pagamento.findFirst({
    where: { contratoId },
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = {
  createAsaasPayment,
  getLatestPagamentoByContrato
};
