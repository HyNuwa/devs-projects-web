import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, '..');
const sourceRoot = path.join(frontendRoot, 'src');
const allowlistPath = path.join(sourceRoot, 'lib', 'kaomoji.ts');
const componentPath = path.join(sourceRoot, 'components', 'ui', 'shadcn', 'kaomoji.tsx');

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listSourceFiles(entryPath) : [entryPath];
    }),
  );

  return files.flat().filter((file) => /\.(?:[cm]?[jt]sx?|css)$/i.test(file));
}

const [allowlist, component, sourceFiles] = await Promise.all([
  readFile(allowlistPath, 'utf8'),
  readFile(componentPath, 'utf8'),
  listSourceFiles(sourceRoot),
]);

if (
  !/kaomojiAllowlist\s*=\s*\{/.test(allowlist) ||
  !/as const satisfies Record<string, LocalKaomoji>/.test(allowlist)
) {
  throw new Error('Kaomoji allowlist must remain a typed local Unicode record.');
}

if (!/aria-hidden="true"/.test(component) || !/data-slot="kaomoji"/.test(component)) {
  throw new Error('Kaomoji component must remain explicitly decorative and source-owned.');
}

const remoteReferences = [];

for (const sourceFile of sourceFiles) {
  const contents = await readFile(sourceFile, 'utf8');
  if (/glyphy(?:\.io)?|https?:\/\/[^\s"']*emoticons/i.test(contents)) {
    remoteReferences.push(path.relative(frontendRoot, sourceFile));
  }
}

if (remoteReferences.length > 0) {
  throw new Error(
    `Runtime Glyphy/emoticon references are not allowed: ${remoteReferences.join(', ')}`,
  );
}

console.log(
  `Verified local typed kaomoji allowlist and ${sourceFiles.length} production source files without remote emoticon requests.`,
);
