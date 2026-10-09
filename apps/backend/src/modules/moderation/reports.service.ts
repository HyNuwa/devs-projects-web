import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReportDto } from './dto/create-report.dto';
import {
  type ModerationTarget,
  targetColumns,
} from './publication-policy.service';
import { hideDecision, isQualifiedReporter } from './rules';
import { loadTarget, updateTargetStatus } from './targets';
import { isPubliclyVisible } from './visibility';

/** Reportes on published content (openspec moderation/cases). */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async file(reporterId: string, dto: CreateReportDto) {
    const target: ModerationTarget = { type: dto.targetType, id: dto.targetId };
    const columns = targetColumns(target);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Reportes on one content run one at a time: two first reportes would
      // otherwise both open a caso (one fails the unique index), and each would
      // count only its own report towards the hiding threshold.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${target.id}, 0))`;
      const snapshot = await loadTarget(tx, target);
      if (!snapshot || !isPubliclyVisible(snapshot, now)) {
        throw new NotFoundException('La publicación no está disponible');
      }
      if (snapshot.authorId === reporterId) {
        throw new ForbiddenException('No podés reportar tu propia publicación');
      }

      const previous = await tx.report.findFirst({
        where: { reporterId, ...columns },
        select: { id: true },
      });
      if (previous) {
        throw new ConflictException('Ya reportaste esta publicación');
      }

      const moderationCase =
        (await tx.moderationCase.findFirst({
          where: { kind: 'REPORTS', status: 'OPEN', ...columns },
          select: { id: true, highPriority: true },
        })) ??
        (await tx.moderationCase.create({
          data: {
            kind: 'REPORTS',
            ...columns,
            targetAuthorId: snapshot.authorId,
          },
        }));

      await tx.report.create({
        data: {
          caseId: moderationCase.id,
          reporterId,
          reason: dto.reason,
          explanation: dto.explanation,
          ...columns,
        },
      });

      const openReports = await tx.report.findMany({
        where: { caseId: moderationCase.id, status: 'OPEN' },
        select: {
          reporterId: true,
          reason: true,
          createdAt: true,
          reporter: { select: { createdAt: true, emailVerified: true } },
        },
      });
      const decision = hideDecision(
        openReports.map((report) => ({
          reporterId: report.reporterId,
          reason: report.reason,
          createdAt: report.createdAt,
          qualified: isQualifiedReporter(report.reporter, now),
        })),
        now,
      );
      const personalData = openReports.some(
        (report) => report.reason === 'DATOS_PERSONALES',
      );

      if (personalData && !moderationCase.highPriority) {
        await tx.moderationCase.update({
          where: { id: moderationCase.id },
          data: { highPriority: true },
        });
      }

      const hides =
        decision === 'HIDE_PERSONAL_DATA' || decision === 'HIDE_REPORT_COUNT';
      if (hides && snapshot.publicationStatus === 'PUBLISHED') {
        await updateTargetStatus(tx, target, {
          publicationStatus: 'HIDDEN',
          hiddenAt: now,
          statusChangedAt: now,
        });
        await tx.moderationEvent.create({
          data: {
            actorId: null,
            action: 'AUTO_HIDDEN',
            ...columns,
            targetUserId: snapshot.authorId,
            caseId: moderationCase.id,
            reason:
              decision === 'HIDE_PERSONAL_DATA'
                ? '1 reporte por datos personales'
                : '3 reportes en 48 h',
            metadata: { label: snapshot.label },
          },
        });
      }
    });

    // The reporter never learns whether the content was hidden.
    return { status: 'RECEIVED' as const };
  }
}
