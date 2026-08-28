import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ExamOutcome } from '../../../generated/prisma';

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

@ValidatorConstraint({ name: 'gradeRequiresExplicitOutcome', async: false })
export class GradeRequiresExplicitOutcomeConstraint implements ValidatorConstraintInterface {
  validate(grade: unknown, args: ValidationArguments) {
    if (grade === undefined || grade === null) {
      return true;
    }

    const { outcome } = args.object as { outcome?: ExamOutcome | null };
    return (
      outcome === ExamOutcome.APROBADO || outcome === ExamOutcome.DESAPROBADO
    );
  }

  defaultMessage() {
    return 'La nota requiere un resultado explícito Aprobado o Desaprobado';
  }
}
