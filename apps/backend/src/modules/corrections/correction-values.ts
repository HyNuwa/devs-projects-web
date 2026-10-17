import type {
  CorrectionField,
  MaterialResourceType,
} from '../../generated/prisma';

/** The classification of a material that a correction can change. */
export type Classification = {
  subjectId: string;
  resourceType: MaterialResourceType;
  academicYear: number | null;
  professorId: string | null;
};

/**
 * A field's value as stored on a suggestion: a uuid for materia and profesor,
 * the enum name for tipo, the year for ciclo; null for «sin profesor» or
 * «sin ciclo».
 */
export function serialize(
  material: Classification,
  field: CorrectionField,
): string | null {
  switch (field) {
    case 'SUBJECT':
      return material.subjectId;
    case 'RESOURCE_TYPE':
      return material.resourceType;
    case 'ACADEMIC_YEAR':
      return material.academicYear === null
        ? null
        : String(material.academicYear);
    case 'PROFESSOR':
      return material.professorId;
  }
}

/** The change to apply to the material when a suggestion is accepted. */
export function changeFor(
  field: CorrectionField,
  value: string | null,
): Partial<Classification> {
  switch (field) {
    case 'SUBJECT':
      return { subjectId: value! };
    case 'RESOURCE_TYPE':
      return { resourceType: value as MaterialResourceType };
    case 'ACADEMIC_YEAR':
      return { academicYear: value === null ? null : Number(value) };
    case 'PROFESSOR':
      return { professorId: value };
  }
}

type MaterialState = { publicationStatus: string; isDeleted: boolean };

/**
 * Retired, rejected or deleted. A material hidden while it is reviewed is not
 * gone: its suggestions wait, unlisted, until it is published again.
 */
export function isGone(material: MaterialState) {
  return (
    material.isDeleted ||
    material.publicationStatus === 'REMOVED' ||
    material.publicationStatus === 'REJECTED'
  );
}

/** A suggestion no longer applies once its field moved or the material left. */
export function isObsolete(
  suggestion: { field: CorrectionField; currentValue: string | null },
  material: Classification & MaterialState,
) {
  return (
    isGone(material) ||
    serialize(material, suggestion.field) !== suggestion.currentValue
  );
}

export const RESOURCE_TYPE_LABELS: Record<MaterialResourceType, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  APUNTE: 'Apunte',
  RESUMEN: 'Resumen',
  TRABAJO_PRACTICO: 'Trabajo práctico',
  GUIA_EJERCICIOS: 'Guía de ejercicios',
  OTRO: 'Otro',
};
