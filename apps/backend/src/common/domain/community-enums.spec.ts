import {
  CommunityDifficulty,
  CourseAttempt,
  ExamOutcome,
} from '../../generated/prisma';

describe('community enum contracts', () => {
  it('mantiene las cuatro situaciones de cursada aprobadas', () => {
    expect(Object.values(CourseAttempt)).toEqual([
      'PRIMERA_CURSADA',
      'PRIMERA_RECURSADA',
      'SEGUNDA_O_MAS_RECURSADAS',
      'PREFIERO_NO_RESPONDER',
    ]);
  });

  it('mantiene una sola escala verbal compartida de dificultad', () => {
    expect(Object.values(CommunityDifficulty)).toEqual([
      'MUY_BAJA',
      'BAJA',
      'MEDIA',
      'ALTA',
      'MUY_ALTA',
    ]);
  });

  it('mantiene resultados de final explícitos sin inferirlos de la nota', () => {
    expect(Object.values(ExamOutcome)).toEqual([
      'APROBADO',
      'DESAPROBADO',
      'PREFIERO_NO_DECIR',
    ]);
  });
});
