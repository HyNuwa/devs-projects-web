import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicationPolicy } from './publication-policy.service';

const NOW = new Date('2026-09-29T12:00:00.000Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 3_600_000);

describe('PublicationPolicy.priorReviewFor', () => {
  let policy: PublicationPolicy;

  const prisma = {
    user: { findUniqueOrThrow: jest.fn() },
    material: { findFirst: jest.fn() },
    courseReview: { findFirst: jest.fn() },
    examExperience: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      createdAt: daysAgo(200),
      emailVerified: true,
    });
    prisma.material.findFirst.mockResolvedValue(null);
    prisma.courseReview.findFirst.mockResolvedValue(null);
    prisma.examExperience.findFirst.mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PublicationPolicy,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    policy = moduleRef.get(PublicationPolicy);
  });

  it('publishes directly for an established account with nothing retired', async () => {
    await expect(policy.priorReviewFor('user-1', NOW)).resolves.toBeNull();
  });

  it('holds contributions when a reseña of the author is still retired from 10 days ago', async () => {
    prisma.courseReview.findFirst.mockResolvedValue({
      statusChangedAt: daysAgo(10),
    });

    await expect(policy.priorReviewFor('user-1', NOW)).resolves.toBe(
      'RECENT_REMOVAL',
    );
  });

  it('only looks at content that is still retired, so a restored retiro does not count', async () => {
    await policy.priorReviewFor('user-1', NOW);

    for (const [delegate, authorField] of [
      [prisma.material.findFirst, 'authorId'],
      [prisma.courseReview.findFirst, 'userId'],
      [prisma.examExperience.findFirst, 'userId'],
    ] as const) {
      expect(delegate).toHaveBeenCalledWith({
        where: { [authorField]: 'user-1', publicationStatus: 'REMOVED' },
        orderBy: { statusChangedAt: 'desc' },
        select: { statusChangedAt: true },
      });
    }
  });

  it('ignores a retiro older than 90 days', async () => {
    prisma.material.findFirst.mockResolvedValue({
      statusChangedAt: daysAgo(91),
    });

    await expect(policy.priorReviewFor('user-1', NOW)).resolves.toBeNull();
  });
});
