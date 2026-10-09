import { PointService } from './point.service';

type Transaction = {
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
};

/** In-memory stand-in for the Prisma transaction client, holding a points ledger. */
function fakeLedger() {
  const transactions: Transaction[] = [];
  const users = new Map([['author', { id: 'author', points: 0, level: 1 }]]);

  const tx = {
    pointTransaction: {
      create: jest.fn(async ({ data }: { data: Transaction }) => {
        transactions.push(data);
        return data;
      }),
      aggregate: jest.fn(
        async ({ where }: { where: { referenceId: string } }) => ({
          _sum: {
            amount: transactions
              .filter(
                (transaction) => transaction.referenceId === where.referenceId,
              )
              .reduce((sum, transaction) => sum + transaction.amount, 0),
          },
        }),
      ),
      findFirst: jest.fn(
        async ({ where }: { where: { referenceId: string } }) =>
          transactions.find(
            (transaction) =>
              transaction.referenceId === where.referenceId &&
              transaction.amount > 0,
          ) ?? null,
      ),
    },
    user: {
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { points?: { increment: number }; level?: number };
        }) => {
          const user = users.get(where.id)!;
          if (data.points) user.points += data.points.increment;
          if (data.level) user.level = data.level;
          return { ...user };
        },
      ),
    },
  };

  return { tx, points: () => users.get('author')!.points, transactions };
}

describe('PointService ledger', () => {
  const service = new PointService({} as never);

  it('awards a contribution once', async () => {
    const { tx, points } = fakeLedger();

    await service.awardFor(tx as never, {
      userId: 'author',
      amount: 10,
      reason: 'MATERIAL_PUBLISHED',
      referenceId: 'm1',
    });
    await service.awardFor(tx as never, {
      userId: 'author',
      amount: 10,
      reason: 'MATERIAL_PUBLISHED',
      referenceId: 'm1',
    });

    expect(points()).toBe(10);
  });

  it('reverts only an active award', async () => {
    const { tx, points } = fakeLedger();

    await service.revertFor(tx as never, 'm1');
    expect(points()).toBe(0);

    await service.awardFor(tx as never, {
      userId: 'author',
      amount: 10,
      reason: 'MATERIAL_PUBLISHED',
      referenceId: 'm1',
    });
    await service.revertFor(tx as never, 'm1');
    await service.revertFor(tx as never, 'm1');
    expect(points()).toBe(0);
  });

  it('ends at the right balance after retiro, restauración and another retiro', async () => {
    const { tx, points, transactions } = fakeLedger();
    const award = {
      userId: 'author',
      amount: 10,
      reason: 'MATERIAL_PUBLISHED',
      referenceId: 'm1',
    };

    await service.awardFor(tx as never, award);
    await service.revertFor(tx as never, 'm1');
    await service.awardFor(tx as never, award);
    expect(points()).toBe(10);

    await service.revertFor(tx as never, 'm1');
    expect(points()).toBe(0);
    expect(transactions.map((transaction) => transaction.reason)).toEqual([
      'MATERIAL_PUBLISHED',
      'MATERIAL_PUBLISHED_REVERTED',
      'MATERIAL_PUBLISHED',
      'MATERIAL_PUBLISHED_REVERTED',
    ]);
  });
});
