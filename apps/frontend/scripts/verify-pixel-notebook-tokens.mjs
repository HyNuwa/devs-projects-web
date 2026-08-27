import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, '..');
const sourceRoot = path.join(frontendRoot, 'src');
const tokenFile = path.join(sourceRoot, 'styles', 'pixel-notebook-tokens.css');

const expectedTokens = new Map([
  ['--pn-canvas', '#fff7eb'],
  ['--pn-paper', '#f9e6cf'],
  ['--pn-surface', '#fff7eb'],
  ['--pn-ink', '#1a1932'],
  ['--pn-muted', '#657392'],
  ['--pn-line', '#f6ca9f'],
  ['--pn-border', '#bf6f4a'],
  ['--pn-cobalt', '#0069aa'],
  ['--pn-cobalt-deep', '#00396d'],
  ['--pn-orange', '#ff5000'],
  ['--pn-gold', '#ffc825'],
  ['--pn-violet', '#7a09fa'],
  ['--pn-green', '#33984b'],
  ['--pn-font-display', '"Iowan Old Style", Charter, Georgia, serif'],
  [
    '--pn-font-body',
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  ],
  ['--pn-font-mono', 'ui-monospace, SFMono-Regular, Consolas, monospace'],
  ['--pn-ease-out', 'cubic-bezier(0.2, 0, 0, 1)'],
  ['--pn-page-width', 'min(1180px, calc(100% - 48px))'],
]);

const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listSourceFiles(entryPath) : [entryPath];
    }),
  );

  return nestedFiles.flat();
}

const tokenCss = await readFile(tokenFile, 'utf8');
const declarations = [...tokenCss.matchAll(/(--pn-[a-z0-9-]+)\s*:\s*([^;]+);/gi)];
const declarationCounts = new Map();

for (const [, name, value] of declarations) {
  declarationCounts.set(name, (declarationCounts.get(name) ?? 0) + 1);
  const expectedValue = expectedTokens.get(name);

  if (!expectedValue) {
    throw new Error(`Unexpected canonical token: ${name}`);
  }

  if (normalize(value) !== normalize(expectedValue)) {
    throw new Error(`${name} differs from the approved export: ${value.trim()}`);
  }
}

for (const name of expectedTokens.keys()) {
  if (declarationCounts.get(name) !== 1) {
    throw new Error(`${name} must be declared exactly once in the canonical stylesheet`);
  }
}

const sourceFiles = await listSourceFiles(sourceRoot);
const duplicateDeclarations = [];

for (const sourceFile of sourceFiles) {
  if (path.resolve(sourceFile) === path.resolve(tokenFile)) continue;
  if (!/\.(css|tsx?|jsx?)$/i.test(sourceFile)) continue;

  const contents = await readFile(sourceFile, 'utf8');
  if (/--pn-[a-z0-9-]+\s*:/i.test(contents)) {
    duplicateDeclarations.push(path.relative(frontendRoot, sourceFile));
  }
}

if (duplicateDeclarations.length > 0) {
  throw new Error(`Pixel Notebook tokens are redeclared in: ${duplicateDeclarations.join(', ')}`);
}

console.log(`Verified ${expectedTokens.size} canonical Pixel Notebook tokens with no route-local declarations.`);
