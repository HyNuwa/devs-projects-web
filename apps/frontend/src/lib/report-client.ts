import { api } from '@/lib/api';

export const reportReasons = [
  'SPAM_O_REPETIDO',
  'INSULTOS_O_ACOSO',
  'DATOS_PERSONALES',
  'NO_RELACIONADO',
  'POSIBLEMENTE_ENGANOSO',
  'OTRO',
] as const;

export type ReportReason = (typeof reportReasons)[number];

export type ModerationTargetType = 'MATERIAL' | 'COURSE_REVIEW' | 'EXAM_EXPERIENCE';

export const reportReasonLabels: Record<ReportReason, string> = {
  SPAM_O_REPETIDO: 'Spam o contenido repetido',
  INSULTOS_O_ACOSO: 'Insultos o acoso',
  DATOS_PERSONALES: 'Expone datos personales',
  NO_RELACIONADO: 'No está relacionado con la materia',
  POSIBLEMENTE_ENGANOSO: 'Información posiblemente engañosa',
  OTRO: 'Otro motivo',
};

/** Files a reporte; visibility is decided by moderation, never by the client. */
export async function createReport(input: {
  targetType: ModerationTargetType;
  targetId: string;
  reason: ReportReason;
  explanation?: string;
}): Promise<void> {
  await api.post('/reports', input);
}
