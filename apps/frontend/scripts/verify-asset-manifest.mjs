import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, '..');
const manifestPath = path.join(frontendRoot, 'assets', 'pixel-notebook', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(manifest.version === 1, 'Unsupported asset manifest version');
assert(Array.isArray(manifest.assets) && manifest.assets.length > 0, 'No approved assets recorded');
assert(Array.isArray(manifest.excluded), 'Excluded candidates must be recorded');

const assetIds = new Set();

for (const asset of manifest.assets) {
  assert(asset.status === 'approved', `${asset.id}: only approved assets may be listed for production`);
  assert(asset.id && !assetIds.has(asset.id), `${asset.id}: asset ids must be unique`);
  assetIds.add(asset.id);
  assert(asset.provider && asset.creator, `${asset.id}: provider and creator are required`);
  assert(asset.source?.projectId && asset.source?.originalFile, `${asset.id}: source provenance is incomplete`);
  assert(asset.rights?.basis && asset.rights?.license, `${asset.id}: rights basis and license are required`);
  assert(
    typeof asset.rights.attributionRequired === 'boolean',
    `${asset.id}: attribution requirement must be explicit`,
  );
  assert(asset.acquiredAt, `${asset.id}: acquisition date is required`);
  assert(asset.sourceSha256?.length === 64, `${asset.id}: SHA-256 is required`);
  assert(asset.dimensions?.width > 0 && asset.dimensions?.height > 0, `${asset.id}: dimensions are required`);
  assert(asset.consumingRoutes?.length > 0, `${asset.id}: at least one consuming route is required`);

  const sourcePath = path.resolve(frontendRoot, asset.sourcePath);
  const governedRoot = path.resolve(frontendRoot, 'assets', 'pixel-notebook', 'source');
  assert(sourcePath.startsWith(`${governedRoot}${path.sep}`), `${asset.id}: source escapes governed asset root`);

  const source = await readFile(sourcePath);
  const hash = createHash('sha256').update(source).digest('hex');
  assert(hash === asset.sourceSha256, `${asset.id}: source hash does not match manifest`);
  assert(source.subarray(1, 4).toString() === 'PNG', `${asset.id}: governed source must be PNG`);
  assert(source.readUInt32BE(16) === asset.dimensions.width, `${asset.id}: source width differs`);
  assert(source.readUInt32BE(20) === asset.dimensions.height, `${asset.id}: source height differs`);
}

for (const candidate of manifest.excluded) {
  assert(candidate.provider && candidate.reason, 'Every excluded candidate needs provider and reason');
}

console.log(
  `Verified ${manifest.assets.length} approved governed assets and ${manifest.excluded.length} excluded candidate groups.`,
);
