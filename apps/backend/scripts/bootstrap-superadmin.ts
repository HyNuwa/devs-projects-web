import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const email = process.env.BOOTSTRAP_SUPERADMIN_EMAIL?.trim();
  if (!email || !process.env.DATABASE_URL)
    throw new Error(
      'Definí DATABASE_URL y BOOTSTRAP_SUPERADMIN_EMAIL para una cuenta ya registrada',
    );
  const db = new PrismaService();
  try {
    await db.onModuleInit();
    const result = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(730011)`;
      if (await tx.user.count({ where: { role: 'SUPERADMIN' } }))
        throw new Error('Ya existe un SUPERADMIN; usá la API administrativa');
      const user = await tx.user.findUnique({ where: { email } });
      if (!user || user.isBanned)
        throw new Error('La cuenta debe existir y estar habilitada');
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'SUPERADMIN' },
      });
      await tx.roleChangeAudit.create({
        data: {
          actorId: user.id,
          targetId: user.id,
          oldRole: user.role,
          newRole: 'SUPERADMIN',
          reason: 'Inicialización operativa del primer SUPERADMIN',
        },
      });
      return { id: user.id, role: 'SUPERADMIN' };
    });
    console.log(JSON.stringify(result));
  } finally {
    await db.onModuleDestroy();
  }
}
void main().catch((error: unknown) => {
  console.error(
    error instanceof Error && error.message.startsWith('Ya existe')
      ? error.message
      : 'No se pudo inicializar SUPERADMIN; verificá la cuenta y la conexión',
  );
  process.exitCode = 1;
});
