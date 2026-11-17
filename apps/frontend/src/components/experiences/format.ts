/**
 * Display formatting for the facts of an experiencia (openspec
 * experiencias-formularios «Units»), shared by the card, the detail, the
 * materia summary and the form preview so every view reads the same.
 */

import type { SubjectExperiencesSummary } from '@/lib/experiences-client';
import { examPeriodLabel } from '@/lib/presentation-labels';

type Maybe = number | null | undefined;
type SummaryExams = SubjectExperiencesSummary['exams'];

const known = (value: Maybe): value is number => value !== null && value !== undefined;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Days in the largest whole unit: «2 meses», «3 semanas», «5 días» (meses = 30, semanas = 7). */
export function formatLeadTime(days: number): string {
  if (days % 30 === 0) return plural(days / 30, 'mes', 'meses');
  if (days % 7 === 0) return plural(days / 7, 'semana', 'semanas');
  return plural(days, 'día', 'días');
}

/** «1 h 30 min», «2 h», «45 min». */
function formatCompactMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Tiempo del examen: «3 horas», «1 h 30 min», «45 min». */
export function formatExamDuration(minutes: number): string {
  return minutes >= 60 && minutes % 60 === 0
    ? plural(minutes / 60, 'hora', 'horas')
    : formatCompactMinutes(minutes);
}

/** Time per day: «1 h por día», «1 h 30 min por día». */
export function formatDailyStudy(minutes: number): string {
  return `${formatCompactMinutes(minutes)} por día`;
}

/** round(lead × daily / 60) hours, only when both facts exist; never stored. */
export function estimateStudyHours(leadDays: Maybe, dailyMinutes: Maybe): number | null {
  return known(leadDays) && known(dailyMinutes) ? Math.round((leadDays * dailyMinutes) / 60) : null;
}

/** «Unas 21 horas de estudio en total». */
export function formatStudyEstimate(hours: number): string {
  return hours === 1 ? 'Una hora de estudio en total' : `Unas ${hours} horas de estudio en total`;
}

/** «Preparación: 3 semanas, 1 h por día», or the one fact declared; null with neither. */
export function formatPreparation(leadDays: Maybe, dailyMinutes: Maybe): string | null {
  const parts = [
    known(leadDays) ? formatLeadTime(leadDays) : null,
    known(dailyMinutes) ? formatDailyStudy(dailyMinutes) : null,
  ].filter(Boolean);
  return parts.length > 0 ? `Preparación: ${parts.join(', ')}` : null;
}

/** «3 profesores», «1 profesor». */
export function formatBoardSize(count: number): string {
  return plural(count, 'profesor', 'profesores');
}

/** «Mesa de 3 profesores · 3 horas», or the one fact declared; null with neither. */
export function formatMesa(boardSize: Maybe, durationMinutes: Maybe): string | null {
  if (known(boardSize)) {
    const mesa = `Mesa de ${formatBoardSize(boardSize)}`;
    return known(durationMinutes) ? `${mesa} · ${formatExamDuration(durationMinutes)}` : mesa;
  }
  return known(durationMinutes)
    ? `Tiempo del examen: ${formatExamDuration(durationMinutes)}`
    : null;
}

/** «Teoría 4/5 · Práctica 3/5», each part only when declared; null with neither. */
export function formatTheoryPractice(theory: Maybe, practice: Maybe): string | null {
  const parts = [
    known(theory) ? `Teoría ${theory}/5` : null,
    known(practice) ? `Práctica ${practice}/5` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** «Promoción · 9», «Desaprobado · 0», or the bare result without a grade. */
export function formatResultWithGrade(result: string, grade: Maybe): string {
  return known(grade) ? `${result} · ${grade}` : result;
}

const integerFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

/**
 * «Nota de promoción · 8,2 / 10 promedio · la informaron 9 de 11», without the
 * average below its minimum (the API sends it null); null with no Promoción.
 */
export function formatPromotionGradeSummary(
  grade: SubjectExperiencesSummary['reviews']['promotionGrade'],
): string | null {
  if (grade.promoted === 0) return null;
  const informed = `la informaron ${integerFormatter.format(grade.informed)} de ${integerFormatter.format(grade.promoted)}`;
  return grade.average !== null
    ? `Nota de promoción · ${decimalFormatter.format(grade.average)} / 10 promedio · ${informed}`
    : `Nota de promoción · ${informed}`;
}

/**
 * «La mesa más comentada es diciembre (9): suele haber 3 profesores y 3 horas»,
 * each median left out below its minimum (the API sends it null).
 */
export function formatTopSessionSentence(
  topSession: NonNullable<SummaryExams['topSession']>,
): string {
  const mesa = `La mesa más comentada es ${examPeriodLabel(topSession.session).toLowerCase()} (${integerFormatter.format(topSession.count)})`;
  const board = topSession.boardSize.median;
  const duration = topSession.duration.median;
  if (board !== null) {
    const professors = `${mesa}: suele haber ${formatBoardSize(board)}`;
    return duration !== null ? `${professors} y ${formatExamDuration(duration)}` : professors;
  }
  return duration !== null ? `${mesa}: suele durar ${formatExamDuration(duration)}` : mesa;
}

/** «Preparación típica»: «3 semanas antes, 1 h por día»; null with neither median. */
export function formatTypicalPreparation(preparation: SummaryExams['preparation']): string | null {
  const lead = preparation.leadDays.median;
  const daily = preparation.dailyMinutes.median;
  const parts = [
    lead !== null ? `${formatLeadTime(lead)} antes` : null,
    daily !== null ? formatDailyStudy(daily) : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * «Solo finales» card: «Teoría 3,4 · Práctica 2,8» from the averages, each
 * omitted below its minimum (the API sends it null); null with neither.
 */
export function formatTheoryPracticeAverages(
  theory: SummaryExams['theory'] | undefined,
  practice: SummaryExams['practice'] | undefined,
): string | null {
  const parts = [
    theory?.average != null ? `Teoría ${decimalFormatter.format(theory.average)}` : null,
    practice?.average != null ? `Práctica ${decimalFormatter.format(practice.average)}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}
