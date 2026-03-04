# Checklist de Homologação (MVP Empresarial)

## Pré-requisitos
- App rodando em `http://localhost:3000`
- Banco criado e migrado
- Admin seedado (`Yt@ll0` / `Yt@ll0`)
- Ambiente sem chave Asaas usa fluxo mock (permitido para validação local)

## 1) Login administrativo
**Objetivo:** validar acesso ao painel interno.
- Acessar `http://localhost:3000/admin/login`
- Entrar com usuário `Yt@ll0` e senha `Yt@ll0`
**Esperado:** redirecionamento para dashboard sem erro 401.

## 2) Criação de cliente + contrato
**Objetivo:** gerar contrato com token único seguro.
- No dashboard, criar cliente com nome e e-mail válidos
**Esperado:** cliente aparece na lista e contrato é criado com link `/contrato/{token}`.

## 3) Acesso ao contrato por token
**Objetivo:** validar acesso público controlado do cliente.
- Abrir o link do contrato recém-criado
**Esperado:** página de assinatura carrega; token inválido exibe erro.

## 4) Assinatura eletrônica
**Objetivo:** registrar formalização com metadados técnicos.
- Preencher nome, CPF/CNPJ, e-mail, endereço e marcar aceite
- Enviar assinatura
**Esperado:** contrato muda para `aguardando_pagamento` e registra data/IP/user-agent.

## 5) Renderização do contrato oficial
**Objetivo:** confirmar texto jurídico completo.
- Abrir `/contrato/{token}/visualizar`
**Esperado:** cláusulas oficiais exibidas com dados dinâmicos do contratante.

## 6) Geração de cobrança
**Objetivo:** validar escolha de pagamento e criação de cobrança.
- Acessar `/pagamento/{token}`
- Gerar cobrança PIX (ou cartão/débito)
**Esperado:** status de pagamento pendente e dados de cobrança exibidos.

## 7) Confirmação de pagamento (homologação local)
**Objetivo:** validar ativação sem gateway real.
- No modo local sem Asaas, usar botão `Confirmar pagamento (mock)`
**Esperado:** contrato ativado automaticamente e redirecionado para página de status.

## 8) Ativação automática + segurança
**Objetivo:** validar regra crítica de negócio.
- Verificar status do contrato após confirmação
- Tentar ativar manualmente pelo admin
**Esperado:**
- Ativação ocorre apenas por confirmação de pagamento
- Ativação manual não é permitida

## 9) PDF do contrato
**Objetivo:** validar geração, armazenamento e download protegido.
- Acessar `/contrato/{token}/pdf` com contrato ativo
**Esperado:**
- PDF é gerado/salvo em `storage/contratos/{contrato_id}.pdf`
- Download funciona para token válido e contrato ativo

## 10) Gestão empresarial no painel
**Objetivo:** validar operação administrativa.
- Conferir gráficos (assinados e atrasados)
- Abrir gestão do cliente
- Ver visão de 12 meses (Mês 1..Mês 12 com valor, prazo e status)
- Executar cancelamento de contrato
**Esperado:** todas as ações refletem no status e no dashboard.

## 11) Rotina automática de ciclo
**Objetivo:** validar motor de renovação/multa/suspensão/cancelamento.
- Validar existência do job diário
- Conferir regras:
  - Renovação ao vencer ciclo
  - Multa+juros após 3 dias
  - Suspensão após 7 dias
  - Cancelamento após 30 dias
**Esperado:** transições automáticas registradas em auditoria.

## 12) Webhook idempotente (quando integrar Asaas)
**Objetivo:** garantir robustez de produção.
- Enviar evento `PAYMENT_CONFIRMED` válido
- Reenviar o mesmo evento
**Esperado:** primeiro processa; duplicado é ignorado com segurança.

---

## Critério de aceite final
- Todos os itens 1–11 aprovados em ambiente local
- Item 12 aprovado em ambiente com credenciais Asaas
- Sem erro de autenticação, rota crítica ou geração de PDF
- Logs de auditoria registrando mudanças de status
