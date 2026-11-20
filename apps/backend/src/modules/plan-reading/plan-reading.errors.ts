/**
 * Why a lectura del plan ended without a proposal (openspec
 * academic-structure/plan-reading, «Limits and errors»). Messages are in
 * Spanish because the editor shows them as they are.
 */
export type PlanReadingErrorCode =
  | 'PLAN_URL_FORBIDDEN'
  | 'PLAN_UNREACHABLE'
  | 'PLAN_TOO_LARGE'
  | 'PLAN_UNSUPPORTED_TYPE'
  | 'PLAN_NOT_FOUND'
  | 'AI_NOT_CONFIGURED'
  | 'AI_QUOTA'
  | 'AI_FAILED'
  | 'DAILY_LIMIT';

const MESSAGES: Record<PlanReadingErrorCode, string> = {
  PLAN_URL_FORBIDDEN:
    'El link del plan tiene que ser https y llevar a un sitio público.',
  PLAN_UNREACHABLE:
    'No pudimos abrir el link del plan. Revisá que funcione y probá de nuevo.',
  PLAN_TOO_LARGE: 'El archivo del plan es demasiado grande (más de 15 MB).',
  PLAN_UNSUPPORTED_TYPE: 'El link del plan no es una página web ni un PDF.',
  PLAN_NOT_FOUND:
    'No encontramos el plan en ese link. Pegá el link directo al PDF del plan.',
  AI_NOT_CONFIGURED:
    'La lectura con IA no está configurada. Cargá la carrera a mano.',
  AI_QUOTA:
    'Se agotó la cuota de la IA por ahora. Cargá la carrera a mano o probá más tarde.',
  AI_FAILED:
    'La IA no pudo leer el plan. Probá de nuevo o cargá la carrera a mano.',
  DAILY_LIMIT:
    'Se alcanzó el límite diario de lecturas del plan. Se renueva a medianoche.',
};

export class PlanReadingError extends Error {
  constructor(
    readonly code: PlanReadingErrorCode,
    message: string = MESSAGES[code],
  ) {
    super(message);
    this.name = 'PlanReadingError';
  }
}
