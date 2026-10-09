import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { MaterialsService } from '../materials/materials.service';
import { SubjectsService } from '../subjects/subjects.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { AccountStatusService } from '../moderation/account-status.service';
import { ActiveAccountGuard } from '../moderation/active-account.guard';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;

  const submissions = { list: jest.fn() };
  const materials = { resubmit: jest.fn() };
  const subjects = { resubmitReview: jest.fn(), resubmitExam: jest.fn() };
  const req = { user: { id: 'user-1' } };
  const file = { originalname: 'final.pdf' } as Express.Multer.File;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        { provide: SubmissionsService, useValue: submissions },
        { provide: MaterialsService, useValue: materials },
        { provide: SubjectsService, useValue: subjects },
        // Every account is active here; restrictions are tested in the moderation e2e.
        ActiveAccountGuard,
        {
          provide: AccountStatusService,
          useValue: { assertCanContribute: jest.fn() },
        },
      ],
    }).compile();
    controller = moduleRef.get(SubmissionsController);
  });

  it('lists only the signed-in author’s submissions', async () => {
    submissions.list.mockResolvedValue([]);

    await controller.list(req);

    expect(submissions.list).toHaveBeenCalledWith('user-1');
  });

  it('resubmits a material with its optional corrected file', async () => {
    await controller.resubmit(req, 'MATERIAL', 'mat-1', file);

    expect(materials.resubmit).toHaveBeenCalledWith('mat-1', 'user-1', file);
  });

  it.each([
    ['COURSE_REVIEW', 'resubmitReview'],
    ['EXAM_EXPERIENCE', 'resubmitExam'],
  ] as const)('resubmits a %s through %s', async (type, method) => {
    await controller.resubmit(req, type, 'entry-1');

    expect(subjects[method]).toHaveBeenCalledWith('entry-1', 'user-1');
  });

  it('propagates the refusal when the entry belongs to someone else', async () => {
    subjects.resubmitReview.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.resubmit(req, 'COURSE_REVIEW', 'entry-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
