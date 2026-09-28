import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Pixel Notebook leftovers that must not come back. The accent pattern skips the
// semantic `--color-accent-foreground` role.
const forbiddenPatterns = [
  [/--pn-[a-z0-9-]+/i, 'Pixel Notebook token'],
  [/--color-primary-\d+/, 'legacy numbered primary alias'],
  [/--color-accent-(?!foreground\b)[a-z]+/, 'legacy accent alias'],
  [/--color-bg-[a-z]+/, 'legacy background alias'],
  [/--color-text-[a-z]+/, 'legacy text alias'],
  [/--font-(?:heading|body|pixel)\b/, 'legacy font variable'],
  [/--paper-ruled\b/, 'Pixel Notebook ruled paper'],
  [/(?<![\w-])font-(?:pixel|serif)\b/, 'legacy font class'],
  [/Press_Start_2P/, 'Press Start 2P font'],
  [/pixel-notebook-tokens\.css/, 'Pixel Notebook token file'],
];

// Approved values from the «DevsProject · Home» canvas (design/canvas/home/project).
const canonicalTokens = new Map([
  ['--dp-ink', '#021238'],
  ['--dp-ink-soft', '#3d4459'],
  ['--dp-muted', '#6b7286'],
  ['--dp-blue', '#0261fe'],
  ['--dp-link', '#0a4de8'],
  ['--dp-blue-tint', '#ecf2fe'],
  ['--dp-page', '#fdf3e5'],
  ['--dp-sand', '#f1eee4'],
  ['--dp-surface', '#ffffff'],
  ['--dp-line', '#e2d9c7'],
  ['--dp-pink', '#fd4f8d'],
  ['--dp-red', '#e01f63'],
  ['--dp-orange', '#fa6304'],
  ['--dp-gold', '#e9b949'],
  ['--dp-green', '#1f8f6b'],
  ['--dp-radius-sm', '8px'],
  ['--dp-radius-md', '11px'],
  ['--dp-radius-lg', '14px'],
  ['--dp-radius-xl', '16px'],
  ['--dp-radius-pill', '999px'],
  ['--dp-outline', '1.5px'],
  ['--dp-shadow-pop', '3px 3px 0 var(--dp-ink)'],
  ['--dp-grid-line', 'rgba(2, 18, 56, 0.032)'],
  ['--dp-grid-size', '44px'],
  ['--dp-grid-size-compact', '32px'],
  ['--dp-font-sans', 'var(--font-figtree), ui-sans-serif, system-ui, sans-serif'],
  ['--dp-font-hand', "var(--font-caveat), 'Segoe Script', cursive"],
  ['--dp-font-mono', 'ui-monospace, SFMono-Regular, Consolas, monospace'],
]);

// Semantic roles consumed by components; each must resolve to a canonical token.
const semanticRoles = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--destructive-foreground',
  '--success',
  '--border',
  '--line',
  '--input',
  '--ring',
  '--link',
  '--radius',
  '--ui-font-sans',
  '--ui-font-hand',
  '--ui-font-mono',
  '--elevation-pop',
];

// Tailwind theme variables exposed through `@theme inline`.
const themeMappings = new Map([
  ...[
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'success',
    'border',
    'line',
    'input',
    'ring',
    'link',
  ].map((role) => [`--color-${role}`, `var(--${role})`]),
  ['--font-sans', 'var(--ui-font-sans)'],
  ['--font-hand', 'var(--ui-font-hand)'],
  ['--font-mono', 'var(--ui-font-mono)'],
  ['--radius-sm', 'var(--dp-radius-sm)'],
  ['--radius-md', 'var(--dp-radius-md)'],
  ['--radius-lg', 'var(--dp-radius-lg)'],
  ['--radius-xl', 'var(--dp-radius-xl)'],
  ['--shadow-pop', 'var(--elevation-pop)'],
]);

const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();

function declarations(css, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  return [...css.matchAll(new RegExp(`(?<![\\w-])${escaped}\\s*:\\s*([^;]+);`, 'g'))].map(
    ([, value]) => value,
  );
}

function checkDeclaration(css, file, name, isValid, expected) {
  const values = declarations(css, name);
  if (values.length !== 1) {
    return [`${file}: ${name} must be declared exactly once (found ${values.length})`];
  }
  return isValid(values[0]) ? [] : [`${file}: ${name} must be ${expected}, found \`${values[0].trim()}\``];
}

async function readStylesheet(frontendRoot, file) {
  try {
    return await readFile(path.join(frontendRoot, file), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function checkCanonicalTokens(frontendRoot) {
  const file = 'src/styles/tokens.css';
  const css = await readStylesheet(frontendRoot, file);
  if (css === null) return [`${file} is missing`];

  return [...canonicalTokens].flatMap(([name, value]) =>
    checkDeclaration(css, file, name, (found) => normalize(found) === normalize(value), value),
  );
}

async function checkSemanticRoles(frontendRoot) {
  const file = 'src/app/globals.css';
  const css = await readStylesheet(frontendRoot, file);
  if (css === null) return [`${file} is missing`];
  const violations = [];

  if (!/color-scheme\s*:\s*light\s*;/.test(css)) {
    violations.push(`${file}: :root must declare color-scheme: light`);
  }

  for (const role of semanticRoles) {
    violations.push(
      ...checkDeclaration(
        css,
        file,
        role,
        (found) => /^var\(--dp-[a-z0-9-]+\)$/.test(normalize(found)),
        'a var(--dp-*) token',
      ),
    );
  }

  for (const [name, value] of themeMappings) {
    violations.push(
      ...checkDeclaration(css, file, name, (found) => normalize(found) === normalize(value), value),
    );
  }

  return violations;
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listSourceFiles(entryPath) : [entryPath];
    }),
  );
  return nested.flat().filter((file) => /\.(css|[jt]sx?)$/i.test(file));
}

async function findLegacyReferences(frontendRoot) {
  const violations = [];

  for (const file of await listSourceFiles(path.join(frontendRoot, 'src'))) {
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    const relativePath = path.relative(frontendRoot, file);

    lines.forEach((line, index) => {
      for (const [pattern, label] of forbiddenPatterns) {
        const match = line.match(pattern);
        if (match) violations.push(`${relativePath}:${index + 1} ${label} \`${match[0]}\``);
      }
    });
  }

  return violations;
}

/**
 * Guards the redesign's design tokens (see apps/frontend/DESIGN.md).
 * Returns one human-readable violation per problem; an empty list means the tree is clean.
 */
export async function verifyDesignTokens(frontendRoot) {
  const results = await Promise.all([
    checkCanonicalTokens(frontendRoot),
    checkSemanticRoles(frontendRoot),
    findLegacyReferences(frontendRoot),
  ]);
  return results.flat();
}
