import { describe, expect, it } from 'vitest';

import {
  courseAttemptLabel,
  courseConditionLabel,
  difficultyLabel,
  examFormatLabel,
  examOutcomeLabel,
  examPeriodLabel,
  resourceTypeLabel,
  shiftLabel,
} from './presentation-labels';

describe('presentation labels', () => {
  it('uses the same Spanish terminology for known academic values', () => {
    expect(shiftLabel('TARDE')).toBe('Tarde');
    expect(courseConditionLabel('PROMO')).toBe('Promoción');
    expect(courseAttemptLabel('SEGUNDA_O_MAS_RECURSADAS')).toBe('Segunda o más recursadas');
    expect(examPeriodLabel('FEBRERO_MARZO')).toBe('Febrero–marzo');
    expect(examFormatLabel('MIXTO')).toBe('Mixto');
    expect(examOutcomeLabel('APROBADO')).toBe('Aprobado');
    expect(difficultyLabel('MUY_ALTA')).toBe('Muy alta');
    expect(resourceTypeLabel('GUIA_EJERCICIOS')).toBe('Guía de ejercicios');
    expect(resourceTypeLabel('GUIA_EJERCICIOS', 'plural')).toBe('Guías de ejercicios');
  });

  it('labels absent, legacy, and unrecognized values honestly', () => {
    expect(shiftLabel(null)).toBe('No informado');
    expect(difficultyLabel(3)).toBe('Dificultad histórica: 3/5');
    expect(examOutcomeLabel('PENDIENTE')).toBe('Resultado de final no reconocido (PENDIENTE)');
    expect(resourceTypeLabel('ARCHIVO')).toBe('Tipo de recurso no reconocido (ARCHIVO)');
  });
});
