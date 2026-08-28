import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateMaterialDto,
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from './create-material.dto';
import { UpdateMaterialDto } from './update-material.dto';

const validMaterial = {
  title: 'Apuntes de Arquitectura de Computadoras',
  subjectId: '20000000-0000-4000-8000-000000000001',
  resourceType: 'APUNTE',
};

async function errorsFor(
  input: Record<string, unknown>,
  type: typeof CreateMaterialDto | typeof UpdateMaterialDto = CreateMaterialDto,
) {
  return validate(plainToInstance(type, input));
}

describe('CreateMaterialDto', () => {
  it('acepta el contexto opcional omitido', async () => {
    await expect(errorsFor(validMaterial)).resolves.toHaveLength(0);
  });

  it('requiere un tipo de recurso válido', async () => {
    expect(
      await errorsFor({ ...validMaterial, resourceType: undefined }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'resourceType' }),
      ]),
    );
    expect(
      await errorsFor({ ...validMaterial, resourceType: 'VIDEO' }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'resourceType' }),
      ]),
    );
  });

  it('acepta los límites de ciclo lectivo y rechaza años fuera de rango', async () => {
    await expect(
      errorsFor({ ...validMaterial, academicYear: MIN_ACADEMIC_YEAR }),
    ).resolves.toHaveLength(0);
    await expect(
      errorsFor({ ...validMaterial, academicYear: MAX_ACADEMIC_YEAR }),
    ).resolves.toHaveLength(0);
    expect(
      await errorsFor({
        ...validMaterial,
        academicYear: MIN_ACADEMIC_YEAR - 1,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'academicYear' }),
      ]),
    );
    expect(
      await errorsFor({
        ...validMaterial,
        academicYear: MAX_ACADEMIC_YEAR + 1,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'academicYear' }),
      ]),
    );
  });

  it('rechaza identificadores de profesor y turnos inválidos', async () => {
    expect(
      await errorsFor({ ...validMaterial, professorId: 'prof-1' }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'professorId' }),
      ]),
    );
    expect(await errorsFor({ ...validMaterial, shift: 'MEDIODIA' })).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'shift' })]),
    );
  });
});

describe('UpdateMaterialDto', () => {
  it('acepta actualizaciones parciales y permite limpiar contexto opcional', async () => {
    await expect(
      errorsFor({ title: 'Título nuevo' }, UpdateMaterialDto),
    ).resolves.toHaveLength(0);
    await expect(
      errorsFor(
        { academicYear: null, professorId: null, shift: null },
        UpdateMaterialDto,
      ),
    ).resolves.toHaveLength(0);
  });
});
