const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/database');
const { audit } = require('../../services/auditService');

async function loginAdmin({ usuario, senha }) {
  const admin = await prisma.admin.findFirst({
    where: {
      OR: [
        { email: usuario },
        { nome: usuario }
      ]
    }
  });
  if (!admin) {
    throw new Error('Credenciais inválidas.');
  }

  const isValid = await bcrypt.compare(senha, admin.senhaHash);
  if (!isValid) {
    throw new Error('Credenciais inválidas.');
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, nome: admin.nome },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  await audit({
    actor: admin.email,
    action: 'admin_login',
    entity: 'admin',
    entityId: admin.id
  });

  return { token, admin };
}

module.exports = { loginAdmin };
