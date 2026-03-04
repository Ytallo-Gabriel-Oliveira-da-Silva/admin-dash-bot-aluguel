# Checklist de Segurança (Produção)

- [ ] HTTPS ativo (SSL válido)
- [ ] `JWT_SECRET` forte e rotacionável
- [ ] `ASAAS_API_KEY` apenas em `.env`
- [ ] `ASAAS_WEBHOOK_SECRET` configurado
- [ ] CORS restrito para domínio oficial
- [ ] Firewall bloqueando portas não utilizadas
- [ ] Backup diário do PostgreSQL
- [ ] PM2 auto-start habilitado
- [ ] Nginx como reverse proxy
- [ ] Logs monitorados e retenção definida
- [ ] Senha admin bootstrap alterada imediatamente
