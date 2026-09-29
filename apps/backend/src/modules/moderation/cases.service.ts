import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';

import type {
  ModerationTargetType,
  Prisma,
  PublicationStatus,
  ReportReason,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { targetColumns } from './publication-policy.service';
import { groupQueue } from './queue';
import { isQualifiedReporter } from './rules';
import { isOverdueHidden } from './visibility';

const subjectSelect = { select: { id: true, code: true, name: true } } as const;
const entryStatus = {
  publicationStatus: true,
  hiddenAt: true,
  subject: subjectSelect,
} as const;

const caseInclude = {
  material: {
    select: {
      id: true,
      title: true,
      description: true,
      authorId: true,
      fileType: true,
      resourceType: true,
      academicYear: true,
      drivePreviewUrl: true,
      ...entryStatus,
    },
  },
  courseReview: {
    select: {
      id: true,
      userId: true,
      isAnonymous: true,
      comment: true,
      recommendation: true,
      academicYear: true,
      ...entryStatus,
    },
  },
  examExperience: {
    select: {
      id: true,
      userId: true,
      isAnonymous: true,
      comment: true,
      year: true,
      ...entryStatus,
    },
  },
  reports: {
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'asc' },
    select: {
      reason: true,
      explanation: true,
      createdAt: true,
      reporterId: true,
      reporter: { select: { createdAt: true, emailVerified: true } },
    },
  },
} satisfies Prisma.ModerationCaseInclude;

type CaseRecord = Prisma.ModerationCaseGetPayload<{
  include: typeof caseInclude;
}>;

type CaseTarget = {
  type: ModerationTargetType;
  id: string;
  authorId: string;
  isAnonymous: boolean;
  label: string;
  status: PublicationStatus;
  hiddenAt: Date | null;
  subject: { id: string; code: string | null; name: string };
  content: Record<string, unknown>;
};

function caseTarget(record: CaseRecord): CaseTarget {
  if (record.material) {
    const { authorId, title, publicationStatus, hiddenAt, subject, ...rest } =
      record.material;
    return {
      type: 'MATERIAL',
      id: rest.id,
      authorId,
      isAnonymous: false,
      label: title,
      status: publicationStatus,
      hiddenAt,
      subject,
      content: { title, ...rest },
    };
  }
  const entry = record.courseReview ?? record.examExperience;
  if (!entry) throw new NotFoundException('El contenido ya no existe');
  const { userId, isAnonymous, publicationStatus, hiddenAt, subject, ...rest } =
    entry;
  return {
    type: record.courseReview ? 'COURSE_REVIEW' : 'EXAM_EXPERIENCE',
    id: rest.id,
    authorId: userId,
    isAnonymous,
    label: record.courseReview ? 'Reseña de cursada' : 'Experiencia de final',
    status: publicationStatus,
    hiddenAt,
    subject,
    content: rest,
  };
}

function topReason(reports: Array<{ reason: ReportReason }>) {
  const counts = new Map<ReportReason, number>();
  for (const { reason } of reports) {
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

const REMOVAL_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

/** The moderation queue and caso detail (openspec moderation/cases). */
@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async queue() {
    const now = new Date();
    const records = await this.prisma.moderationCase.findMany({
      where: { status: 'OPEN' },
      include: caseInclude,
    });

    const items = records.map((record) => {
      const target = caseTarget(record);
      return {
        caseId: record.id,
        kind: record.kind,
        targetType: target.type,
        targetId: target.id,
        label: target.label,
        subject: target.subject,
        isAnonymous: target.isAnonymous,
        targetStatus: target.status,
        reportCount: record.reports.length,
        topReason: topReason(record.reports),
        highPriority: record.highPriority,
        openedAt: record.openedAt,
        overdueHidden: isOverdueHidden(
          { publicationStatus: target.status, hiddenAt: target.hiddenAt },
          now,
        ),
      };
    });

    for (const item of items.filter((entry) => entry.overdueHidden)) {
      await this.recordOverdue(item.caseId, {
        type: item.targetType,
        id: item.targetId,
      });
    }

    return groupQueue(items);
  }

  async detail(caseId: string, viewerId: string) {
    const record = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
      include: caseInclude,
    });
    if (!record) throw new NotFoundException('Caso no encontrado');

    const target = caseTarget(record);
    const columns = targetColumns(target);
    const [author, history] = await Promise.all([
      target.isAnonymous ? null : this.authorSummary(target.authorId),
      this.prisma.moderationCase.findMany({
        where: {
          status: 'CLOSED',
          id: { not: record.id },
          materialId: columns.materialId,
          courseReviewId: columns.courseReviewId,
          examExperienceId: columns.examExperienceId,
        },
        orderBy: { closedAt: 'desc' },
        select: {
          id: true,
          kind: true,
          decision: true,
          decisionReason: true,
          closedAt: true,
        },
      }),
    ]);

    const conflict =
      viewerId === target.authorId
        ? ('OWN_CONTENT' as const)
        : record.reports.some((report) => report.reporterId === viewerId)
          ? ('REPORTED' as const)
          : null;
    const now = new Date();

    return {
      caseId: record.id,
      kind: record.kind,
      status: record.status,
      highPriority: record.highPriority,
      openedAt: record.openedAt,
      overdueHidden: isOverdueHidden(
        { publicationStatus: target.status, hiddenAt: target.hiddenAt },
        now,
      ),
      target: {
        type: target.type,
        id: target.id,
        status: target.status,
        label: target.label,
        subject: target.subject,
        isAnonymous: target.isAnonymous,
        ...target.content,
      },
      reports: record.reports.map((report) => ({
        reason: report.reason,
        explanation: report.explanation,
        createdAt: report.createdAt,
        qualifiedReporter: isQualifiedReporter(report.reporter, now),
      })),
      author: author ?? { hidden: true as const },
      history: history.map((entry) => ({
        caseId: entry.id,
        kind: entry.kind,
        decision: entry.decision,
        decisionReason: entry.decisionReason,
        closedAt: entry.closedAt,
      })),
      viewer: { canDecide: conflict === null, conflict },
    };
  }

  /** Where to read a material caso's file: the staged copy or the published one. */
  async materialFile(caseId: string) {
    const record = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
      select: {
        material: {
          select: {
            stagedFilePath: true,
            driveDownloadUrl: true,
            fileUrl: true,
          },
        },
      },
    });
    const material = record?.material;
    if (!material) throw new NotFoundException('El caso no tiene un archivo');
    if (material.stagedFilePath) return { localPath: material.stagedFilePath };
    if (material.driveDownloadUrl)
      return { redirectUrl: material.driveDownloadUrl };
    return {
      localPath: path.join(
        process.cwd(),
        'public',
        'uploads',
        'materials',
        path.basename(material.fileUrl),
      ),
    };
  }

  async authorSummary(authorId: string) {
    const [user, publishedMaterials, removalsLast90Days] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: authorId },
        select: {
          id: true,
          username: true,
          displayName: true,
          createdAt: true,
        },
      }),
      this.prisma.material.count({
        where: {
          authorId,
          publicationStatus: 'PUBLISHED',
          isDeleted: false,
        },
      }),
      this.prisma.moderationEvent.count({
        where: {
          action: 'REMOVED',
          targetUserId: authorId,
          createdAt: { gte: new Date(Date.now() - REMOVAL_WINDOW_MS) },
        },
      }),
    ]);
    if (!user) return null;
    return {
      hidden: false as const,
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      accountCreatedAt: user.createdAt,
      publishedMaterials,
      removalsLast90Days,
    };
  }

  /** Writes AUTO_UNHIDDEN_OVERDUE the first time an overdue hidden caso is seen. */
  private async recordOverdue(
    caseId: string,
    target: { type: ModerationTargetType; id: string },
  ) {
    const existing = await this.prisma.moderationEvent.findFirst({
      where: { caseId, action: 'AUTO_UNHIDDEN_OVERDUE' },
      select: { id: true },
    });
    if (existing) return;
    await this.prisma.moderationEvent.create({
      data: {
        actorId: null,
        action: 'AUTO_UNHIDDEN_OVERDUE',
        ...targetColumns(target),
        caseId,
        reason: 'Oculto más de 7 días sin revisión: vuelve a verse',
      },
    });
  }
}
