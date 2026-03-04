const { z } = require('zod');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { loginAdmin } = require('./admin.service');
const { prisma } = require('../../config/database');
const { listContratos } = require('../../services/contratoService');
const { CONTRATO_STATUS } = require('../../constants');
const { updateContratoStatus: updateContratoStatusAudit } = require('../../services/statusService');

const loginSchema = z.object({
  usuario: z.string().min(3),
  senha: z.string().min(6)
});

const updateClienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email()
});

const statusSchema = z.object({
  status: z.enum([
    CONTRATO_STATUS.PENDENTE,
    CONTRATO_STATUS.AGUARDANDO_PAGAMENTO,
    CONTRATO_STATUS.PAGO,
    CONTRATO_STATUS.CANCELADO,
    CONTRATO_STATUS.SUSPENSO
  ])
});

const showLogin = asyncHandler(async (req, res) => {
  res.render('admin/login', { title: 'Login Admin' });
});

const doLogin = asyncHandler(async (req, res) => {
  const parsed = loginSchema.parse(req.body);
  const { token } = await loginAdmin(parsed);

  const cookieSecure =
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production';

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.redirect('/admin/dashboard');
});

function getLast12Months() {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    months.push({ date, key, label });
  }
  return months;
}

function toMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function addMonths(date, quantity) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + quantity);
  return next;
}

function normalizeParcelaStatus(payment, dueDate, contratoStatus) {
  if (contratoStatus === CONTRATO_STATUS.CANCELADO) {
    return 'cancelado';
  }

  if (!payment) {
    return dueDate < new Date() ? 'atrasado' : 'pendente';
  }

  if (payment.status === 'confirmado') return 'pago';
  if (payment.status === 'vencido') return 'atrasado';
  if (payment.status === 'estornado') return 'estornado';
  return dueDate < new Date() ? 'atrasado' : 'pendente';
}

const dashboard = asyncHandler(async (req, res) => {
  const [clientes, contratos, pagamentos] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { createdAt: 'desc' } }),
    listContratos(),
    prisma.pagamento.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  const months = getLast12Months();
  const signedByMonth = Object.fromEntries(months.map((month) => [month.key, 0]));
  const overdueByMonth = Object.fromEntries(months.map((month) => [month.key, 0]));

  for (const contrato of contratos) {
    if (!contrato.dataAssinatura) continue;
    const key = toMonthKey(new Date(contrato.dataAssinatura));
    if (signedByMonth[key] !== undefined) signedByMonth[key] += 1;
  }

  const now = new Date();
  for (const pagamento of pagamentos) {
    const isOverdue =
      pagamento.status === 'vencido' ||
      (pagamento.status === 'pendente' && pagamento.dataVencimento && new Date(pagamento.dataVencimento) < now);
    if (!isOverdue) continue;
    const referenceDate = pagamento.dataVencimento ? new Date(pagamento.dataVencimento) : new Date(pagamento.createdAt);
    const key = toMonthKey(referenceDate);
    if (overdueByMonth[key] !== undefined) overdueByMonth[key] += 1;
  }

  const stats = {
    clientes: clientes.length,
    contratos: contratos.length,
    assinados: contratos.filter((contrato) => Boolean(contrato.dataAssinatura)).length,
    ativos: contratos.filter((contrato) => contrato.status === CONTRATO_STATUS.ATIVO).length,
    atrasados: pagamentos.filter(
      (pagamento) =>
        pagamento.status === 'vencido' ||
        (pagamento.status === 'pendente' && pagamento.dataVencimento && new Date(pagamento.dataVencimento) < now)
    ).length
  };

  const runtimeBaseUrl = `${req.protocol}://${req.get('host')}`;
  const baseUrl = process.env.APP_BASE_URL || runtimeBaseUrl;

  res.render('admin/dashboard', {
    title: 'Painel Admin',
    baseUrl,
    valorMensal: Number(process.env.CONTRACT_VALUE_MONTHLY || 149),
    clientes,
    contratos,
    stats,
    chartLabels: months.map((month) => month.label),
    signedSeries: months.map((month) => signedByMonth[month.key]),
    overdueSeries: months.map((month) => overdueByMonth[month.key])
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin/login');
});

const updateContratoStatus = asyncHandler(async (req, res) => {
  const { contratoId } = req.params;
  const { status } = statusSchema.parse(req.body);
  const returnTo = typeof req.body.returnTo === 'string' && req.body.returnTo.startsWith('/admin')
    ? req.body.returnTo
    : '/admin/dashboard';

  if (status === CONTRATO_STATUS.ATIVO) {
    return res.redirect(returnTo);
  }

  await updateContratoStatusAudit({
    contratoId,
    status,
    actor: req.admin?.email || 'admin',
    metadata: { source: 'admin_panel' }
  });

  res.redirect(returnTo);
});

const viewCliente = asyncHandler(async (req, res) => {
  const { clienteId } = req.params;
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      contratos: {
        include: {
          pagamentos: {
            orderBy: { dataVencimento: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!cliente) {
    return res.status(404).render('shared/error', {
      title: 'Cliente não encontrado',
      message: 'Não foi possível localizar o cliente solicitado.'
    });
  }

  const contratosView = cliente.contratos.map((contrato) => {
    const baseDate = new Date(contrato.dataAtivacao || contrato.dataAssinatura || contrato.createdAt);
    const pagamentosPorMes = new Map();

    for (const pagamento of contrato.pagamentos) {
      const referenceDate = new Date(pagamento.dataVencimento || pagamento.createdAt);
      pagamentosPorMes.set(toMonthKey(referenceDate), pagamento);
    }

    const parcelas = Array.from({ length: 12 }, (_, index) => {
      const dueDate = addMonths(baseDate, index);
      const key = toMonthKey(dueDate);
      const pagamento = pagamentosPorMes.get(key);
      return {
        mes: `Mês ${index + 1}`,
        valor: Number(contrato.valor),
        prazo: dueDate,
        status: normalizeParcelaStatus(pagamento, dueDate, contrato.status),
        pagamentoId: pagamento?.id || null
      };
    });

    return {
      ...contrato,
      parcelas,
      resumo: {
        pago: parcelas.filter((parcela) => parcela.status === 'pago').length,
        pendente: parcelas.filter((parcela) => parcela.status === 'pendente').length,
        atrasado: parcelas.filter((parcela) => parcela.status === 'atrasado').length
      }
    };
  });

  return res.render('admin/cliente-detalhe', {
    title: `Gestão de ${cliente.nome}`,
    cliente,
    contratosView
  });
});

const updateCliente = asyncHandler(async (req, res) => {
  const { clienteId } = req.params;
  const parsed = updateClienteSchema.parse(req.body);

  await prisma.cliente.update({
    where: { id: clienteId },
    data: parsed
  });

  return res.redirect(`/admin/clientes/${clienteId}`);
});

const cancelarContrato = asyncHandler(async (req, res) => {
  const { contratoId } = req.params;
  const returnTo = typeof req.body.returnTo === 'string' && req.body.returnTo.startsWith('/admin')
    ? req.body.returnTo
    : '/admin/dashboard';

  await updateContratoStatusAudit({
    contratoId,
    status: CONTRATO_STATUS.CANCELADO,
    actor: req.admin?.email || 'admin',
    metadata: { source: 'admin_cancel_action' }
  });

  return res.redirect(returnTo);
});

module.exports = {
  showLogin,
  doLogin,
  dashboard,
  logout,
  updateContratoStatus,
  viewCliente,
  updateCliente,
  cancelarContrato
};
