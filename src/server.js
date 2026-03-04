const { app } = require('./app');
const { applyOverdueSuspension } = require('./services/suspensaoService');
const { runDailyBillingCycle } = require('./services/billingCycleService');

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});

async function runBackgroundJobs() {
  try {
    await runDailyBillingCycle();
  } catch (error) {
    console.error('Erro no ciclo diário de cobrança:', error.message);
  }

  try {
    await applyOverdueSuspension();
  } catch (error) {
    console.error('Erro ao aplicar suspensão automática:', error.message);
  }
}

runBackgroundJobs();

setInterval(runBackgroundJobs, 24 * 60 * 60 * 1000);

setInterval(async () => {
  try {
    await applyOverdueSuspension();
  } catch (error) {
    console.error('Erro ao aplicar suspensão automática:', error.message);
  }
}, 10 * 60 * 1000);
