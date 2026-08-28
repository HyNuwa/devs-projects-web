import { Client } from 'pg';
import {
  applySearchKeyBackfill,
  planSearchKeyBackfill,
  summarizeSearchKeyBackfill,
} from './search-key-backfill';

const databaseUrl = process.env.DATABASE_URL;
const shouldApply = process.argv.includes('--apply');

if (!databaseUrl) {
  throw new Error('Define DATABASE_URL para ejecutar el backfill.');
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const dryRunPlan = await planSearchKeyBackfill(client);
    console.log(
      JSON.stringify({
        mode: 'dry-run',
        ...summarizeSearchKeyBackfill(dryRunPlan),
      }),
    );

    if (!shouldApply) {
      return;
    }

    await client.query('BEGIN');
    const applyPlan = await planSearchKeyBackfill(client);
    await applySearchKeyBackfill(client, applyPlan);
    await client.query('COMMIT');

    console.log(
      JSON.stringify({
        mode: 'applied',
        ...summarizeSearchKeyBackfill(applyPlan),
      }),
    );
  } catch (error) {
    if (shouldApply) {
      await client.query('ROLLBACK').catch(() => undefined);
    }
    throw error;
  } finally {
    await client.end();
  }
}

void main();
