import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, '..');
const manifestPath = path.join(frontendRoot, 'assets', 'pixel-notebook', 'manifest.json');
const publicHeroDirectory = path.join(frontendRoot, 'public', 'assets', 'pixel-notebook', 'heroes');
const expectedWidths = [640, 960, 1280, 1672];
const expectedFormats = ['avif', 'webp'];
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const publicHeroFiles = await readdir(publicHeroDirectory);
assert(
  publicHeroFiles.every((fileName) => !fileName.toLowerCase().endsWith('.png')),
  'Source PNG files must not be public hero candidates',
);

for (const asset of manifest.assets) {
  assert(asset.generatedVariants.length === 8, `${asset.id}: expected eight responsive variants`);

  for (const width of expectedWidths) {
    for (const format of expectedFormats) {
      const variant = asset.generatedVariants.find(
        (candidate) => candidate.width === width && candidate.format === format,
      );

      assert(variant, `${asset.id}: missing ${width}px ${format} variant`);
      assert(variant.width <= asset.dimensions.width, `${asset.id}: generated width exceeds source`);
      assert(variant.height <= asset.dimensions.height, `${asset.id}: generated height exceeds source`);
      assert(variant.publicPath.endsWith(`.${format}`), `${asset.id}: public path format mismatch`);

      const outputPath = path.resolve(frontendRoot, variant.path);
      const governedPublicRoot = path.resolve(frontendRoot, 'public', 'assets', 'pixel-notebook', 'heroes');
      assert(outputPath.startsWith(`${governedPublicRoot}${path.sep}`), `${asset.id}: output escapes public root`);

      const [metadata, fileStats, contents] = await Promise.all([
        sharp(outputPath).metadata(),
        stat(outputPath),
        readFile(outputPath),
      ]);

      const encodedFormatMatches =
        format === 'avif'
          ? metadata.format === 'heif' && metadata.compression === 'av1'
          : metadata.format === format;
      assert(encodedFormatMatches, `${asset.id}: encoded format mismatch`);
      assert(metadata.width === variant.width && metadata.height === variant.height, `${asset.id}: dimensions mismatch`);
      assert(fileStats.size === variant.bytes, `${asset.id}: byte size differs from manifest`);
      assert(
        createHash('sha256').update(contents).digest('hex') === variant.sha256,
        `${asset.id}: generated hash differs from manifest`,
      );
    }
  }
}

console.log(`Verified ${manifest.assets.length * 8} responsive AVIF/WebP variants; no public source PNGs.`);
