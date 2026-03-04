const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { prisma } = require('../config/database');
const { formatDateBR } = require('../utils/formatDate');

function footer(doc, contrato) {
  const y = doc.page.height - 40;
  doc.fontSize(8).fillColor('#6b7280').text(`ID do Contrato: ${contrato.id}`, 50, y, { align: 'left' });
  doc.fontSize(8).fillColor('#6b7280').text(`Emitido em ${formatDateBR(new Date())}`, 0, y, { align: 'center' });
}

async function generateContratoPdf(contrato) {
  const storageDir = path.join(process.cwd(), 'storage', 'contratos');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const fileName = `${contrato.id}.pdf`;
  const filePath = path.join(storageDir, fileName);
  const relativeUrl = `/storage/contratos/${fileName}`;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.on('pageAdded', () => footer(doc, contrato));

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text('CONTRATO OFICIAL – VERSÃO COMPLETA AVANÇADA', { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(12).text('CONTRATO DE LICENCIAMENTO MENSAL DE USO DE SISTEMA – BOT WHITE-LABEL PREMIUM', { align: 'center' });
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(11).text('CONTRATADA:');
  doc.font('Helvetica').fontSize(10).text('Ytallo Gabriel Oliveira da Silva');
  doc.text('CNPJ: 60.966.649/0001-93');
  doc.text('E-mail: ytallok644549@gmail.com');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(11).text('CONTRATANTE:');
  doc.font('Helvetica').fontSize(10).text(`Nome: ${contrato.nomeContratante || '-'}`);
  doc.text(`CPF/CNPJ: ${contrato.cpfCnpj || '-'}`);
  doc.text(`Endereço: ${contrato.endereco || '-'}`);
  doc.text(`E-mail: ${contrato.emailContratante || '-'}`);
  doc.moveDown();

  const clausulas = [
    {
      titulo: 'CLÁUSULA 1 – OBJETO',
      itens: [
        '1.1 O presente contrato tem como objeto o licenciamento mensal de uso do sistema Bot White-Label Premium.',
        '1.2 O contrato não implica cessão de código-fonte, propriedade intelectual ou acesso à infraestrutura.',
        '1.3 O uso é condicionado à adimplência mensal.'
      ]
    },
    {
      titulo: 'CLÁUSULA 2 – FUNCIONALIDADES',
      itens: [
        'Inclui: abertura e fechamento de grupo, programação automática de horários, anti-link, anti-flood, mensagens automáticas, gestão de administradores, detecção automática de idioma e motor de IA integrado.'
      ]
    },
    {
      titulo: 'CLÁUSULA 3 – INFRAESTRUTURA E SEGURANÇA',
      itens: [
        'O sistema opera em VPS Premium dedicada, incluindo firewall avançado, hardening, SSL, backup automático e monitoramento contínuo.',
        'O CONTRATANTE não possui acesso à infraestrutura.'
      ]
    },
    {
      titulo: 'CLÁUSULA 4 – VALOR E PAGAMENTO',
      itens: [
        '4.1 O valor do licenciamento é R$ 149,00 mensais.',
        '4.2 A ativação ocorre apenas após confirmação do pagamento.',
        '4.3 O pagamento pode ser realizado via PIX, crédito ou débito.'
      ]
    },
    {
      titulo: 'CLÁUSULA 5 – RENOVAÇÃO AUTOMÁTICA',
      itens: [
        '5.1 O contrato possui renovação automática mensal.',
        '5.2 A cada ciclo de 30 dias será gerada nova cobrança.',
        '5.3 O não pagamento até a data de vencimento implicará suspensão automática do serviço e aplicação de multa conforme cláusula 6.',
        '5.4 A continuidade do uso após vencimento caracteriza aceite tácito da renovação.'
      ]
    },
    {
      titulo: 'CLÁUSULA 6 – MULTA E INADIMPLÊNCIA',
      itens: [
        '6.1 Em caso de atraso superior a 3 dias, incidirá multa de 2% sobre o valor mensal e juros de 1% ao mês proporcionais ao atraso.',
        '6.2 Após 7 dias de inadimplência, o serviço poderá ser suspenso automaticamente.',
        '6.3 Após 30 dias, o contrato poderá ser cancelado unilateralmente.'
      ]
    },
    {
      titulo: 'CLÁUSULA 7 – ASSINATURA DIGITAL',
      itens: [
        'Este contrato é firmado eletronicamente e possui validade jurídica conforme legislação brasileira.',
        `Data: ${contrato.dataAssinatura ? formatDateBR(new Date(contrato.dataAssinatura)) : '-'}`,
        `Endereço IP: ${contrato.ipAssinatura || '-'}`,
        `Navegador: ${contrato.userAgent || '-'}`,
        'Assinatura Eletrônica do CONTRATANTE'
      ]
    }
  ];

  for (const bloco of clausulas) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(bloco.titulo);
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(10).fillColor('#111827');
    for (const item of bloco.itens) {
      doc.text(item, { align: 'left', lineGap: 2 });
    }
    doc.moveDown(0.6);
  }

  footer(doc, contrato);

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  await prisma.contrato.update({
    where: { id: contrato.id },
    data: { contratoPdfUrl: relativeUrl }
  });

  return { filePath, relativeUrl };
}

module.exports = { generateContratoPdf };
