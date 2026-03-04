-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "asaas_customer_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cliente_id" TEXT NOT NULL,
    "token_unico" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "nome_contratante" TEXT,
    "cpf_cnpj" TEXT,
    "endereco" TEXT,
    "email_contratante" TEXT,
    "ip_assinatura" TEXT,
    "user_agent" TEXT,
    "data_assinatura" DATETIME,
    "metodo_pagamento" TEXT,
    "valor" DECIMAL NOT NULL,
    "data_ativacao" DATETIME,
    "data_vencimento" DATETIME,
    "token_expira_em" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "contratos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contrato_id" TEXT NOT NULL,
    "asaas_payment_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "data_vencimento" DATETIME,
    "data_confirmacao" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagamentos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asaas_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_asaas_customer_id_key" ON "clientes"("asaas_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_token_unico_key" ON "contratos"("token_unico");

-- CreateIndex
CREATE INDEX "contratos_cliente_id_idx" ON "contratos"("cliente_id");

-- CreateIndex
CREATE INDEX "contratos_status_idx" ON "contratos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_asaas_payment_id_key" ON "pagamentos"("asaas_payment_id");

-- CreateIndex
CREATE INDEX "pagamentos_contrato_id_idx" ON "pagamentos"("contrato_id");

-- CreateIndex
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_asaas_event_id_key" ON "webhook_events"("asaas_event_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
