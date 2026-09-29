import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const modulesRoot = join(__dirname, '..');
// Read paths that must decide public visibility only through `publicVisibility`.
const publicReadModules = ['materials', 'discovery', 'subjects'];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('public read paths', () => {
  it('filter visibility through publicVisibility, never by hand', () => {
    const offenders = publicReadModules
      .flatMap((module) => sourceFiles(join(modulesRoot, module)))
      // Writes may set a status; only `where` filters must go through publicVisibility.
      .filter((file) =>
        /where:\s*\{[^{}]*publicationStatus:\s*['"](PUBLISHED|HIDDEN)['"]/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map((file) => relative(modulesRoot, file));

    expect(offenders).toEqual([]);
  });
});
