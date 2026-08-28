import assert from 'node:assert/strict';

import {
  filterValidationResources,
  filterValidationSuggestions,
  normalizeValidationSearch,
} from '../src/components/validation/pixel-notebook/data.ts';

assert.equal(normalizeValidationSearch('  Análisis  '), 'analisis');

const structureMatches = filterValidationSuggestions('estructura de datos');
assert.deepEqual(
  structureMatches.subjects.map(({ label }) => label),
  ['Estructura de Datos'],
  'The actual seeded subject should be the only subject match.',
);
assert.ok(
  structureMatches.resources.length >= 2,
  'A subject query should surface its relevant resources.',
);

const analysisMatches = filterValidationSuggestions('analisis');
assert.deepEqual(
  analysisMatches.subjects.map(({ label }) => label),
  ['Análisis Matemático II'],
  'Search should be accent-insensitive and should not leak unrelated subjects.',
);

const noMatches = filterValidationSuggestions('materia inexistente');
assert.equal(noMatches.subjects.length, 0);
assert.equal(noMatches.resources.length, 0);

const scopedMatches = filterValidationResources('listas', 'estructura-de-datos');
assert.ok(scopedMatches.length > 0);
assert.ok(
  scopedMatches.every(({ subjectSlug }) => subjectSlug === 'estructura-de-datos'),
  'A subject-scoped search must never return resources from another subject.',
);

console.log('Pixel Notebook prototype search contracts passed.');
