import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../../src/generated/prisma';
import { rebuildPoints } from '../../src/modules/ranking/rebuild-points';

/**
 * Rebuilds every account's points with the ledger's rules (openspec change
 * puntos-libro). Dry run by default: it prints what would change. `--apply`
 * writes it. On the development database, apply only with the owner's consent.
 */
const databaseUrl = process.env.DATABASE_URL;
const apply = process.argv.includes('--apply');

if (!databaseUrl) {
  throw new Error('Define DATABASE_URL para reconstruir los puntos.');
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const report = await rebuildPoints(prisma, { apply });
    const changed = report.filter((row) => row.before !== row.after);
    console.log(
      JSON.stringify({
        mode: apply ? 'applied' : 'dry-run',
        accounts: report.length,
        changed: changed.length,
        rows: changed,
      }),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main();
