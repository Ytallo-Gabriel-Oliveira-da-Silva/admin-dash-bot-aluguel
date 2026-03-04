const { z } = require('zod');
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { getClientIp } = require('../../utils/requestMeta');
const { formatDateBR } = require('../../utils/formatDate');
const { signContrato, getContratoByToken, validateContratoForSignature } = require('../../services/contratoService');
const { getLatestPagamentoByContrato } = require('../../services/pagamentoService');
const { generateContratoPdf } = require('../../services/pdfService');

const assinaturaSchema = z.object({
  nomeCompleto: z.string().min(5),
  cpfCnpj: z.string().min(11),
  endereco: z.string().min(5),
  email: z.string().email(),
  aceite: z.literal('on')
});

const showContratoByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    const contrato = await validateContratoForSignature(token);
    return res.render('contrato/form', {
      title: 'Assinatura de Contrato',
      contrato,
      error: null
    });
  } catch (error) {
    return res.status(400).render('shared/error', {
      title: 'Link inválido',
      message: error.message
    });
  }
});

const submitAssinatura = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const parsed = assinaturaSchema.parse(req.body);

  const contrato = await signContrato({
    token,
    nomeContratante: parsed.nomeCompleto,
    cpfCnpj: parsed.cpfCnpj,
    endereco: parsed.endereco,
    emailContratante: parsed.email,
    ipAssinatura: getClientIp(req),
    userAgent: req.headers['user-agent'] || ''
  });

  res.redirect(`/contrato/${token}/visualizar`);
});

const viewContrato = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const contrato = await getContratoByToken(token);

  if (!contrato || !contrato.dataAssinatura) {
    return res.status(404).render('shared/error', {
      title: 'Contrato indisponível',
      message: 'Contrato ainda não assinado ou inexistente.'
    });
  }

  return res.render('contrato/view', {
    title: 'Contrato Digital',
    contrato,
    dataAssinaturaBR: formatDateBR(contrato.dataAssinatura)
  });
});

const downloadContratoPdf = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const contrato = await getContratoByToken(token);

  if (!contrato) {
    return res.status(404).render('shared/error', {
      title: 'Contrato não encontrado',
      message: 'Token inválido para download do PDF.'
    });
  }

  if (contrato.status !== 'ativo') {
    return res.status(403).render('shared/error', {
      title: 'PDF indisponível',
      message: 'O PDF só pode ser baixado para contratos ativos.'
    });
  }

  if (!contrato.contratoPdfUrl) {
    await generateContratoPdf(contrato);
  }

  const fileName = `${contrato.id}.pdf`;
  const filePath = path.join(process.cwd(), 'storage', 'contratos', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).render('shared/error', {
      title: 'PDF não encontrado',
      message: 'Arquivo PDF não localizado no servidor.'
    });
  }

  return res.download(filePath, `contrato-${contrato.id}.pdf`);
});

const contratoStatus = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const contrato = await getContratoByToken(token);

  if (!contrato) {
    return res.status(404).json({ error: 'Contrato não encontrado.' });
  }

  const pagamento = await getLatestPagamentoByContrato(contrato.id);

  return res.json({
    statusContrato: contrato.status,
    statusPagamento: pagamento?.status || null,
    dataVencimento: pagamento?.dataVencimento || null
  });
});

const showStatusPage = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const contrato = await getContratoByToken(token);

  if (!contrato) {
    return res.status(404).render('shared/error', {
      title: 'Contrato não encontrado',
      message: 'Não foi possível localizar o contrato.'
    });
  }

  return res.render('shared/status', {
    title: 'Status do Contrato',
    contrato
  });
});

module.exports = {
  showContratoByToken,
  submitAssinatura,
  viewContrato,
  contratoStatus,
  showStatusPage,
  downloadContratoPdf
};
