import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyDesignTokens } from './design-tokens/verify.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootFlag = process.argv.indexOf('--root');
const frontendRoot =
  rootFlag === -1 ? path.resolve(scriptDirectory, '..') : path.resolve(process.argv[rootFlag + 1]);

const violations = await verifyDesignTokens(frontendRoot);

if (violations.length > 0) {
  console.error(`Design token check failed (${violations.length}):`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Design tokens OK');
