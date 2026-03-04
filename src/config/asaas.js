const axios = require('axios');

const isAsaasConfigured =
  Boolean(process.env.ASAAS_API_KEY) &&
  process.env.ASAAS_API_KEY !== 'PREENCHER_DEPOIS' &&
  process.env.ASAAS_API_KEY !== 'sua_chave_asaas';

const asaasClient = axios.create({
  baseURL: process.env.ASAAS_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    access_token: process.env.ASAAS_API_KEY
  }
});

module.exports = { asaasClient, isAsaasConfigured };
