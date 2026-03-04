require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = process.env.ADMIN_BOOTSTRAP_USER || 'Yt@ll0';
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || 'ytallo@local.com';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Yt@ll0';

  const senhaHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { email },
    update: {
      nome: user,
      senhaHash
    },
    create: {
      nome: user,
      email,
      senhaHash
    }
  });

  console.log('Admin bootstrap criado/atualizado com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
