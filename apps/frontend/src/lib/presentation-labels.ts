import type { MaterialResourceType, MaterialShift } from '@/types/material';
import type { CourseCondition, ExamFormat, ExamSession, Shift } from '@/types/subject';

export type CourseAttempt =
  'PRIMERA_CURSADA' | 'PRIMERA_RECURSADA' | 'SEGUNDA_O_MAS_RECURSADAS' | 'PREFIERO_NO_RESPONDER';

export type CommunityDifficulty = 'MUY_BAJA' | 'BAJA' | 'MEDIA' | 'ALTA' | 'MUY_ALTA';
export type ExamOutcome = 'APROBADO' | 'DESAPROBADO' | 'PREFIERO_NO_DECIR';

type LabelValue = string | null | undefined;

function withUnknownLabel(
  labels: Readonly<Record<string, string>>,
  value: LabelValue,
  field: string,
  missing: string,
): string {
  if (value === null || value === undefined || value === '') return missing;

  return labels[value] ?? `${field} no reconocido (${value})`;
}

export const shiftLabels: Record<Shift | MaterialShift, string> = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
  NO_INDICO: 'No indicó',
};

export const courseConditionLabels: Record<CourseCondition, string> = {
  PROMO: 'Promoción',
  REGULAR: 'Regular',
  LIBRE: 'Libre',
  PREFIERO_NO_RESPONDER: 'Prefiero no responder',
};

export const courseAttemptLabels: Record<CourseAttempt, string> = {
  PRIMERA_CURSADA: 'Primera cursada',
  PRIMERA_RECURSADA: 'Primera recursada',
  SEGUNDA_O_MAS_RECURSADAS: 'Segunda o más recursadas',
  PREFIERO_NO_RESPONDER: 'Prefiero no responder',
};

export const examPeriodLabels: Record<ExamSession, string> = {
  DICIEMBRE: 'Diciembre',
  JULIO: 'Julio',
  MARZO: 'Marzo',
  FEBRERO_MARZO: 'Febrero–marzo',
  ESPECIAL: 'Mesa especial',
  NO_RECUERDO: 'No recuerda',
};

export const examFormatLabels: Record<ExamFormat, string> = {
  ESCRITO: 'Escrito',
  ORAL: 'Oral',
  MIXTO: 'Mixto',
};

export const examOutcomeLabels: Record<ExamOutcome, string> = {
  APROBADO: 'Aprobado',
  DESAPROBADO: 'Desaprobado',
  PREFIERO_NO_DECIR: 'Prefiero no decir',
};

export const communityDifficultyLabels: Record<CommunityDifficulty, string> = {
  MUY_BAJA: 'Muy baja',
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  MUY_ALTA: 'Muy alta',
};

const resourceTypeLabels: Record<MaterialResourceType, { plural: string; singular: string }> = {
  PARCIAL: { singular: 'Parcial', plural: 'Parciales' },
  FINAL: { singular: 'Final', plural: 'Finales' },
  APUNTE: { singular: 'Apunte', plural: 'Apuntes' },
  RESUMEN: { singular: 'Resumen', plural: 'Resúmenes' },
  TRABAJO_PRACTICO: { singular: 'Trabajo práctico', plural: 'Trabajos prácticos' },
  GUIA_EJERCICIOS: { singular: 'Guía de ejercicios', plural: 'Guías de ejercicios' },
  OTRO: { singular: 'Otro recurso', plural: 'Otros recursos' },
};

export function shiftLabel(value: LabelValue): string {
  return withUnknownLabel(shiftLabels, value, 'Franja horaria', 'No informado');
}

export function courseConditionLabel(value: LabelValue): string {
  return withUnknownLabel(
    courseConditionLabels,
    value,
    'Resultado de cursada',
    'Resultado no informado',
  );
}

export function courseAttemptLabel(value: LabelValue): string {
  return withUnknownLabel(
    courseAttemptLabels,
    value,
    'Situación de cursada',
    'Situación no informada',
  );
}

export function examPeriodLabel(value: LabelValue): string {
  return withUnknownLabel(examPeriodLabels, value, 'Período de final', 'Período no informado');
}

export function examFormatLabel(value: LabelValue): string {
  return withUnknownLabel(examFormatLabels, value, 'Formato de final', 'Formato no informado');
}

export function examOutcomeLabel(value: LabelValue): string {
  return withUnknownLabel(examOutcomeLabels, value, 'Resultado de final', 'Resultado no informado');
}

export function difficultyLabel(value: string | number | null | undefined): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 && value <= 5
      ? `Dificultad histórica: ${value}/5`
      : `Dificultad histórica no reconocida (${value})`;
  }

  return withUnknownLabel(
    communityDifficultyLabels,
    value,
    'Dificultad',
    'Dificultad no informada',
  );
}

export function resourceTypeLabel(
  value: string | null | undefined,
  form: 'plural' | 'singular' = 'singular',
): string {
  if (value === null || value === undefined || value === '') return 'Tipo de recurso no informado';

  return (
    resourceTypeLabels[value as MaterialResourceType]?.[form] ??
    `Tipo de recurso no reconocido (${value})`
  );
}

export const resourceTypeOptions = (Object.keys(resourceTypeLabels) as MaterialResourceType[]).map(
  (value) => ({ label: resourceTypeLabel(value), value }),
);
