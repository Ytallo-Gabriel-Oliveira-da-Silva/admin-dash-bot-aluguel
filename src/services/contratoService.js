const { prisma } = require('../config/database');
const { generateToken } = require('../utils/generateToken');
const { addDays } = require('../utils/requestMeta');
const { CONTRATO_STATUS } = require('../constants');
const { audit } = require('./auditService');

async function createContratoForCliente({ clienteId, valor, tokenExpiryDays }) {
  const token = generateToken();
  const tokenExpiraEm = tokenExpiryDays ? addDays(new Date(), Number(tokenExpiryDays)) : null;

  const contrato = await prisma.contrato.create({
    data: {
      clienteId,
      tokenUnico: token,
      status: CONTRATO_STATUS.PENDENTE,
      valor,
      tokenExpiraEm
    }
  });

  return contrato;
}

async function getContratoByToken(token) {
  return prisma.contrato.findUnique({
    where: { tokenUnico: token },
    include: {
      cliente: true,
      pagamentos: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

async function validateContratoForSignature(token) {
  const contrato = await getContratoByToken(token);
  if (!contrato) {
    throw new Error('Contrato não encontrado.');
  }

  if (contrato.status !== CONTRATO_STATUS.PENDENTE) {
    throw new Error('Contrato indisponível para assinatura.');
  }

  if (contrato.tokenExpiraEm && contrato.tokenExpiraEm < new Date()) {
    throw new Error('Token do contrato expirado.');
  }

  return contrato;
}

async function signContrato({ token, nomeContratante, cpfCnpj, endereco, emailContratante, ipAssinatura, userAgent }) {
  const contrato = await validateContratoForSignature(token);

  const contratoAssinado = await prisma.contrato.update({
    where: { id: contrato.id },
    data: {
      nomeContratante,
      cpfCnpj,
      endereco,
      emailContratante,
      ipAssinatura,
      userAgent,
      dataAssinatura: new Date(),
      status: CONTRATO_STATUS.AGUARDANDO_PAGAMENTO
    },
    include: {
      cliente: true
    }
  });

  await audit({
    actor: 'cliente',
    action: 'contrato_status_update',
    entity: 'contrato',
    entityId: contrato.id,
    metadata: {
      from: CONTRATO_STATUS.PENDENTE,
      to: CONTRATO_STATUS.AGUARDANDO_PAGAMENTO,
      reason: 'assinatura_contrato'
    }
  });

  return contratoAssinado;
}

async function setContratoStatus(id, status) {
  return prisma.contrato.update({
    where: { id },
    data: { status }
  });
}

async function listContratos() {
  return prisma.contrato.findMany({
    include: { cliente: true, pagamentos: true },
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = {
  createContratoForCliente,
  getContratoByToken,
  validateContratoForSignature,
  signContrato,
  setContratoStatus,
  listContratos
};
