const { prisma } = require('../config/database');

async function audit({ actor, action, entity, entityId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        actor,
        action,
        entity,
        entityId,
        metadata
      }
    });
  } catch (error) {
    console.error('Falha ao registrar audit log:', error.message);
  }
}

module.exports = { audit };
