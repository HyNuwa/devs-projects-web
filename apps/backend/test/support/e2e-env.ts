import { e2eDatabaseUrl } from './e2e-database';

// Runs in each worker before the test files import the app, so PrismaService
// connects to the e2e database.
process.env.DATABASE_URL = e2eDatabaseUrl();
