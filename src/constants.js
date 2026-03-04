const CONTRATO_STATUS = {
  PENDENTE: 'pendente',
  AGUARDANDO_PAGAMENTO: 'aguardando_pagamento',
  PAGO: 'pago',
  ATIVO: 'ativo',
  CANCELADO: 'cancelado',
  SUSPENSO: 'suspenso'
};

const PAGAMENTO_STATUS = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  VENCIDO: 'vencido',
  ESTORNADO: 'estornado'
};

module.exports = { CONTRATO_STATUS, PAGAMENTO_STATUS };
