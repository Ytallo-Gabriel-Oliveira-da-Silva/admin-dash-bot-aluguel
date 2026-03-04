-- AlterTable
ALTER TABLE "contratos" ADD COLUMN "contrato_pdf_url" TEXT;

-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN "valor_juros" DECIMAL;
ALTER TABLE "pagamentos" ADD COLUMN "valor_multa" DECIMAL;
ALTER TABLE "pagamentos" ADD COLUMN "valor_original" DECIMAL;
