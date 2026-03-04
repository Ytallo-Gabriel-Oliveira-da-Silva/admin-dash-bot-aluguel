const { formatDateBR } = require('../utils/formatDate');

function getContractText(contrato) {
  const dataAssinatura = contrato.dataAssinatura ? formatDateBR(new Date(contrato.dataAssinatura)) : '-';

  return [
    'CONTRATO DE LICENCIAMENTO MENSAL DE USO DE SISTEMA – BOT WHITE-LABEL PREMIUM',
    '',
    'CONTRATADA:',
    'Ytallo Gabriel Oliveira da Silva',
    'CNPJ: 60.966.649/0001-93',
    'E-mail: ytallok644549@gmail.com',
    '',
    'CONTRATANTE:',
    `Nome: ${contrato.nomeContratante || '-'}`,
    `CPF/CNPJ: ${contrato.cpfCnpj || '-'}`,
    `Endereço: ${contrato.endereco || '-'}`,
    `E-mail: ${contrato.emailContratante || '-'}`,
    '',
    'CLÁUSULA 1 – OBJETO',
    '1.1 O presente contrato tem como objeto o licenciamento mensal de uso do sistema Bot White-Label Premium.',
    '1.2 O contrato não implica cessão de código-fonte, propriedade intelectual ou acesso à infraestrutura.',
    '1.3 O uso é condicionado à adimplência mensal.',
    '',
    'CLÁUSULA 2 – FUNCIONALIDADES',
    'Inclui: abertura e fechamento de grupo, programação automática de horários, anti-link, anti-flood, mensagens automáticas, gestão de administradores, detecção automática de idioma e motor de IA integrado.',
    '',
    'CLÁUSULA 3 – INFRAESTRUTURA E SEGURANÇA',
    'O sistema opera em VPS Premium dedicada, incluindo firewall avançado, hardening, SSL, backup automático e monitoramento contínuo. O CONTRATANTE não possui acesso à infraestrutura.',
    '',
    'CLÁUSULA 4 – VALOR E PAGAMENTO',
    '4.1 O valor do licenciamento é R$ 149,00 mensais.',
    '4.2 A ativação ocorre apenas após confirmação do pagamento.',
    '4.3 O pagamento pode ser realizado via PIX, crédito ou débito.',
    '',
    'CLÁUSULA 5 – RENOVAÇÃO AUTOMÁTICA',
    '5.1 O contrato possui renovação automática mensal.',
    '5.2 A cada ciclo de 30 dias será gerada nova cobrança.',
    '5.3 O não pagamento até a data de vencimento implicará suspensão automática do serviço e aplicação de multa conforme cláusula 6.',
    '5.4 A continuidade do uso após vencimento caracteriza aceite tácito da renovação.',
    '',
    'CLÁUSULA 6 – MULTA E INADIMPLÊNCIA',
    '6.1 Em caso de atraso superior a 3 dias, incidirá multa de 2% sobre o valor mensal e juros de 1% ao mês proporcionais ao atraso.',
    '6.2 Após 7 dias de inadimplência, o serviço poderá ser suspenso automaticamente.',
    '6.3 Após 30 dias, o contrato poderá ser cancelado unilateralmente.',
    '',
    'CLÁUSULA 7 – ASSINATURA DIGITAL',
    'Este contrato é firmado eletronicamente e possui validade jurídica conforme legislação brasileira.',
    `Data: ${dataAssinatura}`,
    `Endereço IP: ${contrato.ipAssinatura || '-'}`,
    `Navegador: ${contrato.userAgent || '-'}`,
    '',
    'Assinatura Eletrônica do CONTRATANTE'
  ].join('\n');
}

module.exports = { getContractText };
