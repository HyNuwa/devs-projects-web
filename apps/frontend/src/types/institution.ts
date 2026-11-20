/** A universidad or facultad as the catalog names it (ADR 0002). */
export interface InstitutionRef {
  id: string;
  name: string;
  shortName: string;
}

/** A facultad with its universidad, wherever a carrera or materia is shown. */
export interface FacultyRef extends InstitutionRef {
  university: InstitutionRef;
}
