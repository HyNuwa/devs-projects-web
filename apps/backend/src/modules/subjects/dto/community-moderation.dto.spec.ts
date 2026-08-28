import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CommunityReportReason } from '../../../generated/prisma';
import {
  CommunityModerationReasonDto,
  CreateCommunityReportDto,
} from './community-moderation.dto';

describe('CreateCommunityReportDto', () => {
  it.each(Object.values(CommunityReportReason))(
    'acepta el motivo categorizado %s',
    async (reason) => {
      const dto = plainToInstance(CreateCommunityReportDto, {
        reason,
        explanation:
          reason === CommunityReportReason.OTRO
            ? 'La opción disponible no describe el problema.'
            : undefined,
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
    },
  );

  it('exige una explicación acotada cuando el motivo es Otro', async () => {
    const missing = plainToInstance(CreateCommunityReportDto, {
      reason: CommunityReportReason.OTRO,
    });
    const tooLong = plainToInstance(CreateCommunityReportDto, {
      reason: CommunityReportReason.OTRO,
      explanation: 'x'.repeat(1001),
    });

    expect((await validate(missing)).map(({ property }) => property)).toContain(
      'explanation',
    );
    expect((await validate(tooLong)).map(({ property }) => property)).toContain(
      'explanation',
    );
  });

  it('rechaza motivos desconocidos y marcado HTML', async () => {
    const invalidReason = plainToInstance(CreateCommunityReportDto, {
      reason: 'DESACUERDO',
    });
    const markup = plainToInstance(CreateCommunityReportDto, {
      reason: CommunityReportReason.OTRO,
      explanation: '<script>alert(1)</script>',
    });

    expect(
      (await validate(invalidReason)).map(({ property }) => property),
    ).toContain('reason');
    expect((await validate(markup)).map(({ property }) => property)).toContain(
      'explanation',
    );
  });
});

describe('CommunityModerationReasonDto', () => {
  it('recorta y acepta un motivo de moderación en texto plano', async () => {
    const dto = plainToInstance(CommunityModerationReasonDto, {
      reason: '  Expone datos personales  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.reason).toBe('Expone datos personales');
  });

  it('rechaza motivos vacíos, extensos o con marcado', async () => {
    for (const reason of ['', 'x'.repeat(1001), '<b>Motivo</b>']) {
      const errors = await validate(
        plainToInstance(CommunityModerationReasonDto, { reason }),
      );
      expect(errors.map(({ property }) => property)).toContain('reason');
    }
  });
});
