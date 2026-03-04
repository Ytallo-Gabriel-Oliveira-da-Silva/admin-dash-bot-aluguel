# Bot White-Label - Contrato Digital + Pagamento + Ativação Automática

Plataforma SaaS privada para formalização digital do licenciamento mensal do Bot White-Label Premium.

## Stack
- Node.js 20+
- Express + EJS
- PostgreSQL
- Prisma ORM
- JWT (somente admin)
- Integração Asaas (PIX, cartão de crédito e débito)

## Funcionalidades implementadas
- Painel admin com login JWT
- Criação manual de cliente e contrato
- Gestão de cliente (editar dados + visualizar contas)
- Geração de token seguro (`crypto.randomBytes(48).toString('hex')`)
- Link exclusivo `/contrato/:token`
- Assinatura eletrônica com IP, user-agent e data
- Contrato HTML dinâmico
- Página de pagamento (PIX, crédito até 3x, débito)
- Webhook em `POST /webhook/asaas` com validação e idempotência
- Ativação automática de contrato após `PAYMENT_CONFIRMED`
- Suspensão automática para pagamentos vencidos
- Dashboard com gráficos de assinados e atrasados (12 meses)
- Visualização de contas por contrato em 12 meses (`Mês 1` ... `Mês 12`) com status `pago`, `pendente`, `atrasado`, `estornado` e cancelamento

## Estrutura
```bash
src/
  config/
  middleware/
  modules/
    admin/
    clientes/
    contratos/
    pagamentos/
  services/
  utils/
  views/
  public/
  app.js
  routes.js
  server.js
prisma/
  schema.prisma
  seed.js
```

## Configuração
1. Copie `.env.example` para `.env`
2. Ajuste as variáveis:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ASAAS_API_URL`
   - `ASAAS_API_KEY`
   - `ASAAS_WEBHOOK_SECRET`
  - `COOKIE_SECURE` (`false` para HTTP puro em IP; `true` com HTTPS)

## Rodando local
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Fluxo principal
1. Admin faz login em `/admin/login`
2. Admin cria cliente e contrato no dashboard
3. Cliente acessa `/contrato/:token`
4. Cliente assina contrato e vai para pagamento
5. Cliente paga via Asaas
6. Webhook confirma pagamento e ativa contrato

## Credencial admin (padrão)
- Usuário: `Yt@ll0`
- Senha: `Yt@ll0`

> Esses valores são definidos no seed por padrão (ou via `.env`).

## Segurança aplicada
- Helmet
- Rate limit
- CORS restrito
- JWT para admin
- Hash de senha com bcrypt
- Validação com Zod
- Logs de auditoria em banco
- Sem armazenamento de dados de cartão

## Deploy (resumo)
- PM2 para processo Node
- Nginx reverse proxy
- SSL obrigatório
- Firewall e backup do PostgreSQL

## Observações
- O endpoint de webhook exige assinatura quando `ASAAS_WEBHOOK_SECRET` estiver definido.
- Para produção, use `NODE_ENV=production` e HTTPS ativo no proxy.
