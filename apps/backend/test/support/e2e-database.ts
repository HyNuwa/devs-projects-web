/**
 * The e2e suites run against their own database, next to the development one, so the
 * append-only moderation history of the demo data never collects test events.
 * Override with E2E_DATABASE_URL; otherwise `<DATABASE_URL database>_e2e` is used.
 */
export function e2eDatabaseUrl(): string {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error(
      'Define DATABASE_URL (o E2E_DATABASE_URL) para correr los tests e2e.',
    );
  }
  const url = new URL(base);
  const database = url.pathname.replace(/^\//, '');
  url.pathname = `/${database.endsWith('_e2e') ? database : `${database}_e2e`}`;
  return url.toString();
}

/** The same server's maintenance database, to create the e2e one. */
export function maintenanceUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  url.search = '';
  return url.toString();
}
