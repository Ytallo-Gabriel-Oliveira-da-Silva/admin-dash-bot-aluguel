const { z } = require('zod');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { getContratoByToken } = require('../../services/contratoService');
const { createAsaasPayment } = require('../../services/pagamentoService');
const { processAsaasWebhook } = require('../../services/webhookService');
const { getClientIp } = require('../../utils/requestMeta');

const pagamentoSchema = z.object({
  tipo: z.enum(['pix', 'cartao_credito', 'debito']),
  installments: z.coerce.number().min(1).max(3).optional(),
  cardHolderName: z.string().optional(),
  cardNumber: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  ccv: z.string().optional(),
  holderCpfCnpj: z.string().optional(),
  holderEmail: z.string().optional(),
  holderName: z.string().optional(),
  holderPostalCode: z.string().optional(),
  holderAddressNumber: z.string().optional(),
  holderPhone: z.string().optional()
});

const showPagamento = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const contrato = await getContratoByToken(token);

  if (!contrato || !contrato.dataAssinatura) {
    return res.status(404).render('shared/error', {
      title: 'Contrato indisponível',
      message: 'Assine o contrato antes de continuar.'
    });
  }

  if (!['aguardando_pagamento', 'ativo', 'suspenso'].includes(contrato.status)) {
    return res.status(403).render('shared/error', {
      title: 'Pagamento indisponível',
      message: 'Contrato fora do fluxo de pagamento.'
    });
  }

  return res.render('pagamento/index', {
    title: 'Pagamento',
    contrato,
    pixData: null,
    paymentData: null,
    error: null,
    selectedTipo: 'pix'
  });
});

const createPagamento = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const parsed = pagamentoSchema.parse(req.body);

  const contrato = await getContratoByToken(token);
  if (!contrato) {
    return res.status(404).render('shared/error', {
      title: 'Contrato não encontrado',
      message: 'Não foi possível localizar o contrato.'
    });
  }

  if (contrato.status !== 'aguardando_pagamento' && contrato.status !== 'suspenso') {
    return res.status(403).render('shared/error', {
      title: 'Edição bloqueada',
      message: 'Este contrato não pode gerar nova cobrança neste status.'
    });
  }

  const creditCard = parsed.cardNumber
    ? {
        holderName: parsed.cardHolderName,
        number: parsed.cardNumber,
        expiryMonth: parsed.expiryMonth,
        expiryYear: parsed.expiryYear,
        ccv: parsed.ccv
      }
    : undefined;

  const creditCardHolderInfo = parsed.holderCpfCnpj
    ? {
        name: parsed.holderName,
        email: parsed.holderEmail,
        cpfCnpj: parsed.holderCpfCnpj,
        postalCode: parsed.holderPostalCode,
        addressNumber: parsed.holderAddressNumber,
        phone: parsed.holderPhone
      }
    : undefined;

  let result;
  try {
    result = await createAsaasPayment({
      contrato,
      tipo: parsed.tipo,
      installments: parsed.installments,
      creditCard,
      creditCardHolderInfo,
      remoteIp: getClientIp(req)
    });
  } catch (error) {
    return res.status(400).render('pagamento/index', {
      title: 'Pagamento',
      contrato,
      pixData: null,
      paymentData: null,
      error: error.message,
      selectedTipo: parsed.tipo
    });
  }

  return res.render('pagamento/index', {
    title: 'Pagamento',
    contrato,
    pixData: parsed.tipo === 'pix' ? result.asaas : null,
    paymentData: result.asaas,
    error: null,
    selectedTipo: parsed.tipo
  });
});

const webhookAsaas = asyncHandler(async (req, res) => {
  const result = await processAsaasWebhook(req.body);
  return res.json({ ok: true, result });
});

module.exports = {
  showPagamento,
  createPagamento,
  webhookAsaas
};
