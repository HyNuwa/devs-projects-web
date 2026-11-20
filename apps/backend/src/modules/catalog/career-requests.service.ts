import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import type { CareerRequestStatus } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, mailError } from '../mail/mail.service';
import { CatalogService } from './catalog.service';
import type {
  AcceptCareerRequestDto,
  CreateCareerRequestDto,
} from './dto/career-requests.dto';

type Tx = Prisma.TransactionClient;

/** Pending solicitudes a student may author at once. */
export const PENDING_LIMIT = 3;

const notFound = () => new NotFoundException('Solicitud no encontrada');
const notPending = () =>
  new ConflictException({
    code: 'REQUEST_NOT_PENDING',
    message: 'La solicitud ya no está pendiente.',
  });

const careerPath = (career: {
  code: string;
  faculty: { shortName: string; university: { shortName: string } };
}) =>
  [
    '/universidades',
    career.faculty.university.shortName,
    career.faculty.shortName,
    career.code,
  ]
    .map((part, index) => (index === 0 ? part : part.toLowerCase()))
    .join('/');

const careerSelect = {
  id: true,
  name: true,
  code: true,
  status: true,
  faculty: {
    select: { shortName: true, university: { select: { shortName: true } } },
  },
} as const;

/**
 * Solicitudes de carrera (openspec academic-structure/career-requests). The
 * author is not a supporter row: a solicitud counts 1 + its supporters.
 */
@Injectable()
export class CareerRequestsService {
  private readonly logger = new Logger(CareerRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly mail: MailService,
  ) {}

  // ── Students ──────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateCareerRequestDto) {
    if (dto.facultyId && (dto.facultyText || dto.universityText)) {
      throw new BadRequestException(
        'Elegí una facultad del catálogo o escribila, no las dos.',
      );
    }
    if (!dto.facultyId && !dto.facultyText) {
      throw new BadRequestException('Falta la facultad.');
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockVerifiedAccount(tx, userId);
      if (dto.facultyId)
        await this.catalog.mustExist('FACULTY', dto.facultyId, tx);
      const pending = await tx.careerRequest.count({
        where: { authorId: userId, status: 'PENDING' },
      });
      if (pending >= PENDING_LIMIT) {
        throw new ConflictException({
          code: 'REQUEST_LIMIT',
          message: `Ya tenés ${PENDING_LIMIT} solicitudes pendientes. Esperá a que las resolvamos.`,
        });
      }
      return tx.careerRequest.create({
        data: {
          authorId: userId,
          facultyId: dto.facultyId ?? null,
          facultyText: dto.facultyId ? null : (dto.facultyText ?? null),
          universityText: dto.facultyId ? null : (dto.universityText ?? null),
          careerName: dto.careerName,
          planUrl: dto.planUrl,
          comment: dto.comment ?? null,
        },
        select: { id: true, status: true },
      });
    });
  }

  /** Pending solicitudes of a facultad, for «Yo también»; nobody's identity. */
  async pendingInFaculty(userId: string, facultyId: string) {
    const rows = await this.prisma.careerRequest.findMany({
      where: { facultyId, status: 'PENDING' },
      select: {
        id: true,
        careerName: true,
        planUrl: true,
        authorId: true,
        createdAt: true,
        _count: { select: { supporters: true } },
        supporters: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      careerName: row.careerName,
      planUrl: row.planUrl,
      createdAt: row.createdAt,
      count: 1 + row._count.supporters,
      mine: row.authorId === userId,
      supported: row.supporters.length > 0,
    }));
  }

  support(userId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockVerifiedAccount(tx, userId);
      const request = await this.lockRequest(tx, requestId);
      if (request.status !== 'PENDING') throw notPending();
      if (!request.faculty_id) {
        throw new ConflictException({
          code: 'REQUEST_NOT_JOINABLE',
          message: 'Esta solicitud no admite «Yo también».',
        });
      }
      if (request.author_id === userId) {
        throw new ConflictException({
          code: 'REQUEST_OWN',
          message: 'Es tu propia solicitud.',
        });
      }
      try {
        await tx.careerRequestSupporter.create({ data: { requestId, userId } });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException({
            code: 'REQUEST_ALREADY_SUPPORTED',
            message: 'Ya te sumaste a esta solicitud.',
          });
        }
        throw error;
      }
      await tx.careerRequest.update({
        where: { id: requestId },
        data: { updatedAt: new Date() },
      });
    });
  }

  unsupport(userId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await this.lockRequest(tx, requestId);
      if (request.status !== 'PENDING') throw notPending();
      const { count } = await tx.careerRequestSupporter.deleteMany({
        where: { requestId, userId },
      });
      if (count === 0) throw notFound();
    });
  }

  /**
   * The author withdraws: with supporters the solicitud passes to the first who
   * joined, without them it closes as withdrawn.
   */
  withdraw(userId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await this.lockRequest(tx, requestId);
      if (request.author_id !== userId) throw notFound();
      if (request.status !== 'PENDING') throw notPending();
      const first = await tx.careerRequestSupporter.findFirst({
        where: { requestId },
        orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }],
      });
      if (first) {
        await tx.careerRequestSupporter.delete({
          where: { requestId_userId: { requestId, userId: first.userId } },
        });
        await tx.careerRequest.update({
          where: { id: requestId },
          data: { authorId: first.userId },
        });
        return { status: 'PENDING' as const };
      }
      await tx.careerRequest.update({
        where: { id: requestId },
        data: { status: 'WITHDRAWN' },
      });
      return { status: 'WITHDRAWN' as const };
    });
  }

  /** «Mis solicitudes»: authored or joined, newest first. */
  async mine(userId: string) {
    const rows = await this.prisma.careerRequest.findMany({
      where: {
        OR: [{ authorId: userId }, { supporters: { some: { userId } } }],
      },
      select: {
        id: true,
        authorId: true,
        careerName: true,
        planUrl: true,
        facultyText: true,
        universityText: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        faculty: {
          select: {
            name: true,
            shortName: true,
            university: { select: { shortName: true } },
          },
        },
        career: { select: careerSelect },
        _count: { select: { supporters: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      careerName: row.careerName,
      planUrl: row.planUrl,
      faculty: row.faculty
        ? `${row.faculty.name} · ${row.faculty.university.shortName}`
        : [row.facultyText, row.universityText].filter(Boolean).join(' · '),
      status: row.status,
      rejectionReason: row.status === 'REJECTED' ? row.rejectionReason : null,
      career:
        row.career && row.career.status === 'PUBLISHED'
          ? { name: row.career.name, path: careerPath(row.career) }
          : null,
      count: 1 + row._count.supporters,
      mine: row.authorId === userId,
      createdAt: row.createdAt,
    }));
  }

  // ── Admins ────────────────────────────────────────────────────────────────

  async pending() {
    const rows = await this.prisma.careerRequest.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        careerName: true,
        planUrl: true,
        comment: true,
        facultyText: true,
        universityText: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { username: true } },
        faculty: {
          select: {
            id: true,
            name: true,
            shortName: true,
            university: { select: { id: true, name: true, shortName: true } },
          },
        },
        _count: { select: { supporters: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(({ _count, author, ...row }) => ({
      ...row,
      author: author.username,
      count: 1 + _count.supporters,
    }));
  }

  async pendingCount() {
    return {
      pending: await this.prisma.careerRequest.count({
        where: { status: 'PENDING' },
      }),
    };
  }

  /**
   * Creates the carrera en borrador (and the facultad and universidad typed in
   * free text, with the values the admin confirmed) in one transaction.
   */
  accept(actorId: string, requestId: string, dto: AcceptCareerRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const request = await this.lockRequest(tx, requestId);
      if (request.status !== 'PENDING') throw notPending();

      let facultyId = request.faculty_id;
      if (!facultyId && dto.facultyId) {
        await this.catalog.mustExist('FACULTY', dto.facultyId, tx);
        facultyId = dto.facultyId;
      }
      if (!facultyId) {
        const faculty = dto.faculty;
        if (!faculty) {
          throw new BadRequestException(
            'La facultad de esta solicitud no está en el catálogo: confirmá su nombre y nombre corto.',
          );
        }
        let universityId = faculty.universityId;
        if (!universityId) {
          if (!faculty.university) {
            throw new BadRequestException(
              'Elegí la universidad o confirmá la nueva.',
            );
          }
          universityId = (
            await this.catalog.createUniversity(actorId, faculty.university, tx)
          ).id;
        }
        facultyId = (
          await this.catalog.createFaculty(
            actorId,
            { universityId, name: faculty.name, shortName: faculty.shortName },
            tx,
          )
        ).id;
      }
      const career = await this.catalog.createCareer(
        actorId,
        {
          facultyId,
          name: dto.career.name,
          code: dto.career.code,
          planUrl: request.plan_url,
        },
        tx,
      );
      await this.resolve(tx, actorId, request, 'ACCEPTED', {
        careerId: career.id,
        facultyId,
      });
      return { careerId: career.id };
    });
  }

  async reject(actorId: string, requestId: string, reason: string) {
    const request = await this.prisma.$transaction(async (tx) => {
      const request = await this.lockRequest(tx, requestId);
      if (request.status !== 'PENDING') throw notPending();
      await this.resolve(tx, actorId, request, 'REJECTED', {
        rejectionReason: reason,
      });
      return request;
    });
    await this.notify(requestId, (to, username) =>
      this.mail.sendCareerRequestRejected(
        to,
        username,
        request.career_name,
        reason,
      ),
    );
  }

  alreadyLoaded(actorId: string, requestId: string, careerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await this.lockRequest(tx, requestId);
      if (request.status !== 'PENDING') throw notPending();
      const career = await tx.career.findUnique({
        where: { id: careerId },
        select: { status: true },
      });
      if (!career || career.status !== 'PUBLISHED') {
        throw new BadRequestException('Elegí una carrera publicada.');
      }
      await this.resolve(tx, actorId, request, 'ALREADY_LOADED', { careerId });
    });
  }

  /** After a carrera is published: tell everyone in its accepted solicitudes. */
  async notifyPublished(requestIds: string[]) {
    for (const requestId of requestIds) {
      const request = await this.prisma.careerRequest.findUnique({
        where: { id: requestId },
        select: { career: { select: careerSelect } },
      });
      if (!request?.career) continue;
      const career = request.career;
      await this.notify(requestId, (to, username) =>
        this.mail.sendCareerPublished(
          to,
          username,
          career.name,
          careerPath(career),
        ),
      );
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async resolve(
    tx: Tx,
    actorId: string,
    request: LockedRequest,
    status: CareerRequestStatus,
    data: { careerId?: string; facultyId?: string; rejectionReason?: string },
  ) {
    await tx.careerRequest.update({
      where: { id: request.id },
      data: { ...data, status, resolvedById: actorId, resolvedAt: new Date() },
    });
    await this.catalog.record(tx, actorId, 'CAREER_REQUEST_RESOLVED', {
      kind: 'CAREER',
      id: data.careerId ?? request.id,
      label: request.career_name,
      before: { status: 'PENDING' },
      after: { status, ...data },
      requestId: request.id,
    });
  }

  /** Emails go after commit, one per recipient; a failure is only logged. */
  private async notify(
    requestId: string,
    send: (to: string, username: string) => Promise<void>,
  ) {
    const request = await this.prisma.careerRequest.findUnique({
      where: { id: requestId },
      select: {
        author: {
          select: { email: true, username: true, emailVerified: true },
        },
        supporters: {
          select: {
            user: {
              select: { email: true, username: true, emailVerified: true },
            },
          },
        },
      },
    });
    if (!request) return;
    const people = [request.author, ...request.supporters.map((s) => s.user)];
    for (const person of people) {
      if (!person.emailVerified) continue;
      try {
        await send(person.email, person.username);
      } catch (error) {
        this.logger.error(
          { requestId, error: mailError(error) },
          'Career request email failed',
        );
      }
    }
  }

  private async lockRequest(tx: Tx, id: string) {
    const [request] = await tx.$queryRaw<LockedRequest[]>`
      SELECT "id", "author_id", "faculty_id", "career_name", "plan_url", "status"::text AS "status"
      FROM "career_requests" WHERE "id" = ${id}::uuid FOR UPDATE`;
    if (!request) throw notFound();
    return request;
  }

  /** Verified email (the active-account guard covers sanciones); locks for the limit. */
  private async lockVerifiedAccount(tx: Tx, userId: string) {
    const [account] = await tx.$queryRaw<{ email_verified: boolean }[]>`
      SELECT "email_verified" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`;
    if (!account?.email_verified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verificá tu email para pedir una carrera.',
      });
    }
  }
}

type LockedRequest = {
  id: string;
  author_id: string;
  faculty_id: string | null;
  career_name: string;
  plan_url: string;
  status: CareerRequestStatus;
};
