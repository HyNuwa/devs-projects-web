import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CourseCondition, ExamOutcome } from '../../../generated/prisma';

@ValidatorConstraint({ name: 'singleProfessorReference', async: false })
export class SingleProfessorReferenceConstraint implements ValidatorConstraintInterface {
  validate(professorId: unknown, args: ValidationArguments) {
    if (typeof professorId !== 'string' || professorId.length === 0) {
      return true;
    }

    const candidate = args.object as {
      professorName?: unknown;
      examinerName?: unknown;
    };
    const manualName = candidate.professorName ?? candidate.examinerName;

    return typeof manualName !== 'string' || manualName.trim().length === 0;
  }

  defaultMessage() {
    return 'Indicá un profesor registrado o un nombre manual, no ambos';
  }
}

export function outcomeRequiresGrade(outcome: unknown) {
  return (
    outcome === ExamOutcome.APROBADO || outcome === ExamOutcome.DESAPROBADO
  );
}

/** Aprobado and Desaprobado need a grade; Prefiero no decir takes none. */
@ValidatorConstraint({ name: 'gradeMatchesOutcome', async: false })
export class GradeMatchesOutcomeConstraint implements ValidatorConstraintInterface {
  validate(grade: unknown, args: ValidationArguments) {
    const { outcome } = args.object as { outcome?: unknown };
    const declared = grade !== undefined && grade !== null;
    if (outcomeRequiresGrade(outcome)) return declared;
    return !declared || outcome !== ExamOutcome.PREFIERO_NO_DECIR;
  }

  defaultMessage(args: ValidationArguments) {
    const { outcome } = args.object as { outcome?: unknown };
    return outcomeRequiresGrade(outcome)
      ? 'Indicá la nota del final, de 0 a 10'
      : 'Si elegís «Prefiero no decir», no se pide la nota';
  }
}

@ValidatorConstraint({ name: 'promotionGradeRequiresPromo', async: false })
export class PromotionGradeRequiresPromoConstraint implements ValidatorConstraintInterface {
  validate(promotionGrade: unknown, args: ValidationArguments) {
    if (promotionGrade === undefined || promotionGrade === null) return true;
    const { condition } = args.object as { condition?: unknown };
    return condition === CourseCondition.PROMO;
  }

  defaultMessage() {
    return 'La nota de promoción solo se indica con resultado Promoción';
  }
}

/**
 * Temas que tomaron: trims, collapses inner whitespace and keeps the first
 * spelling of entries that differ only in case or spacing. Anything that is not
 * a list of strings is returned untouched for the validators to reject.
 */
export function normalizeTopics(value: unknown) {
  if (!Array.isArray(value)) return value;
  const seen = new Set<string>();
  const topics: unknown[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') {
      topics.push(entry);
      continue;
    }
    const topic = entry.trim().replace(/\s+/g, ' ');
    const key = topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(topic);
  }
  return topics;
}
