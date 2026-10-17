// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(scriptsDirectory, '..', 'verify-design-tokens.mjs');
const cleanFixture = path.join(scriptsDirectory, '__fixtures__', 'clean');

const roots = [];

function fixtureRoot() {
  const root = mkdtempSync(path.join(tmpdir(), 'design-tokens-'));
  cpSync(cleanFixture, root, { recursive: true });
  roots.push(root);
  return root;
}

function edit(root, relativePath, transform) {
  const file = path.join(root, relativePath);
  writeFileSync(file, transform(readFileSync(file, 'utf8')));
}

function verify(root) {
  const result = spawnSync(process.execPath, [cli, '--root', root], { encoding: 'utf8' });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('verify-design-tokens', () => {
  it('passes a tree that uses only the canonical tokens and semantic roles', () => {
    const { status, output } = verify(fixtureRoot());

    expect(output).toContain('Design tokens OK');
    expect(status).toBe(0);
  });

  it.each([
    ['a Pixel Notebook token', 'color: var(--pn-ink);'],
    ['a numbered legacy primary alias', 'color: var(--color-primary-500);'],
    ['a legacy accent alias', 'color: var(--color-accent-gold);'],
    ['a legacy text alias', 'color: var(--color-text-secondary);'],
    ['a legacy background alias', 'background: var(--color-bg-secondary);'],
    ['the legacy heading font', 'font-family: var(--font-heading);'],
    ['the pixel font variable', 'font-family: var(--font-pixel);'],
    ['the serif font variable', 'font-family: var(--font-serif);'],
    ['the Press Start 2P family by name', "font-family: 'Press Start 2P', monospace;"],
  ])('fails with file and line when a stylesheet uses %s', (_label, declaration) => {
    const root = fixtureRoot();
    writeFileSync(
      path.join(root, 'src', 'components', 'Legacy.module.css'),
      `.title {\n  font-weight: 800;\n  ${declaration}\n}\n`,
    );

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toMatch(/src[\\/]components[\\/]Legacy\.module\.css:3/);
  });

  it.each([
    ['the pixel font class', 'font-pixel'],
    ['the serif font class', 'font-serif'],
    ['a removed offset-shadow class', 'shadow-control'],
  ])('fails when a component uses %s', (_label, className) => {
    const root = fixtureRoot();
    edit(root, 'src/components/Card.tsx', (source) => source.replace('font-sans', className));

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toMatch(/src[\\/]components[\\/]Card\.tsx:2/);
  });

  it('fails naming the token when a canonical value drifts from the canvas', () => {
    const root = fixtureRoot();
    edit(root, 'src/styles/tokens.css', (css) => css.replace('--dp-blue: #0261fe;', '--dp-blue: #0069aa;'));

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toContain('--dp-blue');
  });

  it('fails when a canonical token is missing', () => {
    const root = fixtureRoot();
    edit(root, 'src/styles/tokens.css', (css) => css.replace(/\s*--dp-green:[^;]+;/, ''));

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toContain('--dp-green');
  });

  it('fails when a semantic role does not resolve to a canonical token', () => {
    const root = fixtureRoot();
    edit(root, 'src/app/globals.css', (css) =>
      css.replace('--primary: var(--dp-blue);', '--primary: #0069aa;'),
    );

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toContain('--primary');
  });

  it('fails when a Tailwind theme mapping is missing', () => {
    const root = fixtureRoot();
    edit(root, 'src/app/globals.css', (css) => css.replace(/\s*--color-ring:[^;]+;/, ''));

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toContain('--color-ring');
  });

  it('fails when the light color scheme is not declared', () => {
    const root = fixtureRoot();
    edit(root, 'src/app/globals.css', (css) => css.replace('color-scheme: light;', ''));

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toContain('color-scheme');
  });

  it('reports a missing canonical token file instead of crashing', () => {
    const root = fixtureRoot();
    rmSync(path.join(root, 'src', 'styles', 'tokens.css'));

    const { status, output } = verify(root);

    expect(status).toBe(1);
    expect(output).toContain('src/styles/tokens.css is missing');
  });

  it('does not flag the semantic accent-foreground role', () => {
    const { status } = verify(fixtureRoot());

    expect(status).toBe(0);
  });
});
