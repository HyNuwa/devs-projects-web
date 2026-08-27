import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, '..');
const manifestPath = path.join(frontendRoot, 'assets', 'pixel-notebook', 'manifest.json');
const outputDirectory = path.join(frontendRoot, 'public', 'assets', 'pixel-notebook', 'heroes');
const widths = [640, 960, 1280, 1672];
const formats = [
  { extension: 'avif', options: { quality: 58, effort: 6 } },
  { extension: 'webp', options: { quality: 82, effort: 6, smartSubsample: true } },
];

sharp.cache(false);
sharp.concurrency(1);

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
await mkdir(outputDirectory, { recursive: true });

for (const asset of manifest.assets) {
  const sourcePath = path.resolve(frontendRoot, asset.sourcePath);
  const sourceMetadata = await sharp(sourcePath).metadata();

  if (sourceMetadata.width !== asset.dimensions.width || sourceMetadata.height !== asset.dimensions.height) {
    throw new Error(`${asset.id}: source dimensions differ from the governed manifest`);
  }

  const generatedVariants = [];

  for (const width of widths) {
    for (const format of formats) {
      const outputName = `${asset.id}-${width}.${format.extension}`;
      const outputPath = path.join(outputDirectory, outputName);
      const pipeline = sharp(sourcePath).resize({
        width,
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      });

      if (format.extension === 'avif') {
        await pipeline.avif(format.options).toFile(outputPath);
      } else {
        await pipeline.webp(format.options).toFile(outputPath);
      }

      const [metadata, fileStats, fileContents] = await Promise.all([
        sharp(outputPath).metadata(),
        stat(outputPath),
        readFile(outputPath),
      ]);

      generatedVariants.push({
        format: format.extension,
        width: metadata.width,
        height: metadata.height,
        bytes: fileStats.size,
        sha256: createHash('sha256').update(fileContents).digest('hex'),
        path: `public/assets/pixel-notebook/heroes/${outputName}`,
        publicPath: `/assets/pixel-notebook/heroes/${outputName}`,
      });
    }
  }

  asset.generatedVariants = generatedVariants;
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const variantCount = manifest.assets.reduce((total, asset) => total + asset.generatedVariants.length, 0);
console.log(`Generated ${variantCount} responsive Pixel Notebook hero variants.`);
