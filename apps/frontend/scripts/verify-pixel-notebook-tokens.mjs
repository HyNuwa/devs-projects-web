import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, '..');
const sourceRoot = path.join(frontendRoot, 'src');
const tokenFile = path.join(sourceRoot, 'styles', 'pixel-notebook-tokens.css');
const globalStylesheet = path.join(sourceRoot, 'app', 'globals.css');

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

const semanticTokenRoles = new Map([
  ['--background', '--pn-canvas'],
  ['--foreground', '--pn-ink'],
  ['--card', '--pn-surface'],
  ['--card-foreground', '--pn-ink'],
  ['--popover', '--pn-canvas'],
  ['--popover-foreground', '--pn-ink'],
  ['--primary', '--pn-cobalt'],
  ['--primary-foreground', '--pn-canvas'],
  ['--secondary', '--pn-paper'],
  ['--secondary-foreground', '--pn-cobalt-deep'],
  ['--muted', '--pn-paper'],
  ['--muted-foreground', '--pn-muted'],
  ['--accent', '--pn-gold'],
  ['--accent-foreground', '--pn-ink'],
  ['--destructive', '--pn-orange'],
  ['--destructive-foreground', '--pn-ink'],
  ['--success', '--pn-green'],
  ['--border', '--pn-border'],
  ['--input', '--pn-border'],
  ['--ring', '--pn-cobalt'],
  ['--ui-font-sans', '--pn-font-body'],
  ['--ui-font-serif', '--pn-font-display'],
  ['--ui-font-mono', '--pn-font-mono'],
]);

const semanticValueRoles = new Map([
  ['--radius', '0px'],
  ['--elevation-control', '2px 2px 0 var(--pn-ink)'],
  ['--elevation-field', '4px 4px 0 var(--pn-line)'],
  ['--elevation-surface', '3px 3px 0 var(--pn-line)'],
]);

const tailwindRoleMappings = new Map([
  ['--color-background', '--background'],
  ['--color-foreground', '--foreground'],
  ['--color-card', '--card'],
  ['--color-card-foreground', '--card-foreground'],
  ['--color-popover', '--popover'],
  ['--color-popover-foreground', '--popover-foreground'],
  ['--color-primary', '--primary'],
  ['--color-primary-foreground', '--primary-foreground'],
  ['--color-secondary', '--secondary'],
  ['--color-secondary-foreground', '--secondary-foreground'],
  ['--color-muted', '--muted'],
  ['--color-muted-foreground', '--muted-foreground'],
  ['--color-accent', '--accent'],
  ['--color-accent-foreground', '--accent-foreground'],
  ['--color-destructive', '--destructive'],
  ['--color-destructive-foreground', '--destructive-foreground'],
  ['--color-success', '--success'],
  ['--color-border', '--border'],
  ['--color-input', '--input'],
  ['--color-ring', '--ring'],
  ['--font-sans', '--ui-font-sans'],
  ['--font-serif', '--ui-font-serif'],
  ['--font-mono', '--ui-font-mono'],
  ['--radius-sm', '--radius'],
  ['--radius-md', '--radius'],
  ['--radius-lg', '--radius'],
  ['--radius-xl', '--radius'],
  ['--shadow-control', '--elevation-control'],
  ['--shadow-field', '--elevation-field'],
  ['--shadow-surface', '--elevation-surface'],
]);

const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();
const escapeRegularExpression = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function declarationValues(stylesheet, name) {
  const expression = new RegExp(`${escapeRegularExpression(name)}\\s*:\\s*([^;]+);`, 'g');
  return [...stylesheet.matchAll(expression)].map(([, value]) => value);
}

function assertDeclaration(stylesheet, name, expectedValue) {
  const values = declarationValues(stylesheet, name);

  if (values.length !== 1) {
    throw new Error(`${name} must be declared exactly once in app/globals.css`);
  }

  if (normalize(values[0]) !== normalize(expectedValue)) {
    throw new Error(`${name} must map to ${expectedValue}, received ${values[0].trim()}`);
  }
}

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
const globalCss = await readFile(globalStylesheet, 'utf8');
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

for (const [role, token] of semanticTokenRoles) {
  assertDeclaration(globalCss, role, `var(${token})`);
}

for (const [role, value] of semanticValueRoles) {
  assertDeclaration(globalCss, role, value);
}

if (!/@theme\s+inline\s*\{/.test(globalCss)) {
  throw new Error('Tailwind semantic roles must use @theme inline in app/globals.css');
}

for (const [role, semanticRole] of tailwindRoleMappings) {
  assertDeclaration(globalCss, role, `var(${semanticRole})`);
}

const sourceFiles = await listSourceFiles(sourceRoot);
const duplicateDeclarations = [];
const tokenImports = [];
const unknownTokenReferences = [];

for (const sourceFile of sourceFiles) {
  if (path.resolve(sourceFile) === path.resolve(tokenFile)) continue;
  if (!/\.(css|tsx?|jsx?)$/i.test(sourceFile)) continue;

  const contents = await readFile(sourceFile, 'utf8');
  const relativePath = path.relative(frontendRoot, sourceFile);

  if (contents.includes('pixel-notebook-tokens.css')) {
    tokenImports.push(relativePath);
  }

  if (/--pn-[a-z0-9-]+\s*:/i.test(contents)) {
    duplicateDeclarations.push(relativePath);
  }

  for (const [, token] of contents.matchAll(/var\(\s*(--pn-[a-z0-9-]+)/gi)) {
    if (!expectedTokens.has(token)) {
      unknownTokenReferences.push(`${relativePath}: ${token}`);
    }
  }
}

if (duplicateDeclarations.length > 0) {
  throw new Error(`Pixel Notebook tokens are redeclared in: ${duplicateDeclarations.join(', ')}`);
}

const expectedImportPath = path.relative(frontendRoot, globalStylesheet);

if (tokenImports.length !== 1 || tokenImports[0] !== expectedImportPath) {
  throw new Error(
    `Pixel Notebook tokens must be imported only by ${expectedImportPath}; found: ${tokenImports.join(', ') || 'none'}`,
  );
}

if (unknownTokenReferences.length > 0) {
  throw new Error(`Unknown Pixel Notebook token references: ${unknownTokenReferences.join(', ')}`);
}

console.log(
  `Verified ${expectedTokens.size} canonical Pixel Notebook tokens, one global import, and semantic Tailwind/shadcn role mappings.`,
);
