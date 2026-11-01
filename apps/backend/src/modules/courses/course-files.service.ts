import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { databaseWrite } from '../../common/database-errors';
import {
  AuthenticatedUser,
  hasPermissions,
} from '../authorization/permissions';
import { DriveService } from '../drive/drive.service';
import { CoursesService } from './courses.service';
import { byteRange, validateCourseFile } from './course-file.validation';

@Injectable()
export class CourseFilesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CourseFilesService.name);
  private readonly stagingDir: string;
  private timer?: ReturnType<typeof setInterval>;
  private reconciling = false;
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesService,
    private readonly drive: DriveService,
    config: ConfigService,
  ) {
    this.stagingDir = path.resolve(
      config.get<string>('COURSE_UPLOAD_STAGING_DIR', 'storage/course-uploads'),
    );
  }
  onModuleInit() {
    if (!this.drive.isConfigured) return;
    this.timer = setInterval(() => {
      void this.reconcile().catch(() =>
        this.logger.warn('No se pudo ejecutar la reconciliación de archivos'),
      );
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async upload(
    courseId: string,
    lessonId: string,
    userId: number,
    file?: Express.Multer.File,
  ) {
    if (
      !file?.buffer ||
      file.size !== file.buffer.length ||
      !file.originalname ||
      file.originalname.length > 255
    )
      throw new BadRequestException('Archivo inválido');
    const mimeType = validateCourseFile(file.originalname, file.buffer);
    await this.managementLesson(courseId, lessonId);
    await this.drive.ready();
    const operationId = randomUUID();
    const record = await this.reserve(courseId, lessonId, {
      uploaderId: userId,
      operationId,
      originalName: path.basename(file.originalname),
      mimeType,
      size: BigInt(file.size),
      origin: 'UPLOAD',
    });
    try {
      await fs.mkdir(this.stagingDir, { recursive: true });
      await fs.writeFile(this.staged(operationId), file.buffer, {
        flag: 'wx',
        mode: 0o600,
      });
      await this.processOne(record.id);
    } catch (error) {
      await this.fail(record.id, error);
      throw error instanceof HttpException
        ? error
        : new ServiceUnavailableException(
            'No se pudo guardar el archivo; la operación quedó registrada',
          );
    }
    return this.result(record.id);
  }
  async import(
    courseId: string,
    lessonId: string,
    userId: number,
    driveFileId: string,
    allowDownload: boolean,
  ) {
    await this.managementLesson(courseId, lessonId);
    const metadata = await this.drive.metadata(driveFileId);
    await this.checkSignature(
      driveFileId,
      metadata.name,
      metadata.size,
      metadata.mimeType,
    );
    const record = await this.reserve(courseId, lessonId, {
      uploaderId: userId,
      driveFileId,
      originalName: metadata.name,
      mimeType: metadata.mimeType,
      size: BigInt(metadata.size),
      origin: 'IMPORT',
      allowDownload,
    });
    try {
      await this.processOne(record.id);
    } catch (error) {
      await this.fail(record.id, error);
      throw error;
    }
    return this.result(record.id);
  }
  async detach(courseId: string, lessonId: string, id: string) {
    await this.courses.mutate(courseId, async (tx) => {
      await this.courses.lessonIn(tx, courseId, lessonId);
      const file = await tx.courseFile.findFirst({ where: { id, lessonId } });
      if (!file) throw new NotFoundException('Archivo no encontrado');
      if (file.state === 'PENDING' || file.retryAt > new Date())
        throw new ConflictException('Hay una operación en curso');
      await tx.courseFile.update({
        where: { id },
        data: { state: 'DETACHING', retryAt: new Date(), attempts: 0 },
      });
    });
    await this.processOne(id).catch(() =>
      this.logger.warn('Limpieza de archivo pendiente de reintento'),
    );
    return { detached: true };
  }
  async content(
    courseId: string,
    lessonId: string,
    id: string,
    user: AuthenticatedUser,
    rangeHeader?: string,
    download = false,
  ) {
    await this.courses.assertAccess(courseId, user);
    const file = await this.prisma.courseFile.findFirst({
      where: {
        id,
        lessonId,
        lesson: { section: { courseId } },
        state: 'READY',
      },
    });
    if (!file?.driveFileId)
      throw new NotFoundException('Archivo no encontrado');
    if (
      download &&
      !file.allowDownload &&
      !hasPermissions(user.role, ['courses:manage'])
    )
      throw new ForbiddenException('Descarga no habilitada');
    const metadata = await this.drive.metadata(file.driveFileId);
    if (
      metadata.mimeType !== file.mimeType ||
      BigInt(metadata.size) !== file.size
    )
      throw new ConflictException('El archivo cambió en el almacenamiento');
    const range = byteRange(rangeHeader, metadata.size);
    const stream = await this.drive.media(
      file.driveFileId,
      range ? `bytes=${range.start}-${range.end}` : undefined,
    );
    return { stream, file, range, size: metadata.size };
  }
  async reconcile() {
    if (this.reconciling || !this.drive.isConfigured) return;
    this.reconciling = true;
    try {
      const pending = await this.prisma.courseFile.findMany({
        where: {
          state: { in: ['PENDING', 'FAILED', 'DETACHING'] },
          retryAt: { lte: new Date() },
          attempts: { lt: 10 },
        },
        orderBy: { retryAt: 'asc' },
        take: 10,
        select: { id: true },
      });
      for (const file of pending)
        await this.processOne(file.id).catch(() =>
          this.logger.warn('Archivo pendiente de reintento'),
        );
    } finally {
      this.reconciling = false;
    }
  }
  private async processOne(id: string): Promise<void> {
    // Atomic lease prevents the request and periodic workers from uploading twice.
    const claimed = await this.prisma.courseFile.updateMany({
      where: {
        id,
        state: { in: ['PENDING', 'FAILED', 'DETACHING'] },
        retryAt: { lte: new Date() },
      },
      data: {
        retryAt: new Date(Date.now() + 10 * 60000),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) return;
    const file = await this.prisma.courseFile.findUniqueOrThrow({
      where: { id },
    });
    try {
      if (file.state === 'DETACHING') {
        if (file.origin === 'UPLOAD') {
          const remote =
            file.driveFileId ??
            (await this.drive.findOperation(file.operationId));
          if (remote)
            await this.drive
              .removeOwned(remote, file.operationId)
              .catch((error: unknown) => {
                if (!(error instanceof NotFoundException)) throw error;
              });
        }
        await this.prisma.courseFile.delete({ where: { id } });
        await fs.unlink(this.staged(file.operationId)).catch(() => undefined);
        return;
      }
      let remote = file.driveFileId;
      if (file.origin === 'UPLOAD') {
        remote ??= await this.drive.findOperation(file.operationId);
        if (!remote) {
          // Open first so missing staging rejects instead of emitting an unhandled stream error.
          const handle = await fs.open(this.staged(file.operationId), 'r');
          try {
            remote = await this.drive.upload(() => handle.createReadStream(), {
              name: file.originalName,
              mimeType: file.mimeType,
              operationId: file.operationId,
            });
          } finally {
            await handle.close();
          }
        }
      }
      if (!remote)
        throw new ServiceUnavailableException(
          'Archivo pendiente de recuperación',
        );
      const metadata = await this.drive.metadata(remote);
      if (
        metadata.mimeType !== file.mimeType ||
        BigInt(metadata.size) !== file.size
      )
        throw new ConflictException('El archivo cambió en el almacenamiento');
      // Course-level serialization also protects edits and publication validity.
      await this.courses.mutate(await this.courseId(file.lessonId), (tx) =>
        tx.courseFile.update({
          where: { id },
          data: {
            driveFileId: remote,
            state: 'READY',
            lastErrorCode: null,
            retryAt: new Date(),
          },
        }),
      );
      await fs.unlink(this.staged(file.operationId)).catch(() => undefined);
    } catch (error) {
      await this.fail(id, error, file.state === 'DETACHING');
      throw error;
    }
  }
  private async fail(id: string, error: unknown, detaching = false) {
    await this.prisma.courseFile
      .updateMany({
        where: { id, state: { not: 'READY' } },
        data: {
          state: detaching ? 'DETACHING' : 'FAILED',
          lastErrorCode:
            error instanceof HttpException
              ? `HTTP_${error.getStatus()}`
              : 'STORAGE_FAILURE',
          retryAt: new Date(Date.now() + 60000),
        },
      })
      .catch(() =>
        this.logger.warn(
          'No se pudo registrar el fallo; la reserva sigue pendiente',
        ),
      );
  }
  private async reserve(
    courseId: string,
    lessonId: string,
    data: Omit<Prisma.CourseFileUncheckedCreateInput, 'lessonId'>,
  ) {
    return databaseWrite(() =>
      this.courses.mutate(courseId, async (tx) => {
        await this.courses.lessonIn(tx, courseId, lessonId);
        return tx.courseFile.create({ data: { ...data, lessonId } });
      }),
    );
  }
  private async managementLesson(courseId: string, lessonId: string) {
    const lesson = await this.prisma.courseLesson.findFirst({
      where: { id: lessonId, section: { courseId } },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException('Clase no encontrada');
  }
  private async courseId(lessonId: string) {
    const lesson = await this.prisma.courseLesson.findUniqueOrThrow({
      where: { id: lessonId },
      select: { section: { select: { courseId: true } } },
    });
    return lesson.section.courseId;
  }
  private staged(operationId: string) {
    return path.join(this.stagingDir, operationId);
  }
  private async result(id: string) {
    const file = await this.prisma.courseFile.findUniqueOrThrow({
      where: { id },
    });
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size.toString(),
      state: file.state,
      allowDownload: file.allowDownload,
    };
  }
  private async checkSignature(
    id: string,
    name: string,
    size: number,
    mimeType: string,
  ) {
    if (name.length > 255)
      throw new BadRequestException('Nombre de archivo demasiado largo');
    const stream = await this.drive.media(
      id,
      `bytes=0-${Math.min(size - 1, 15)}`,
    );
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk as Uint8Array));
        if (Buffer.concat(chunks).length >= 16) break;
      }
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo comprobar el contenido del archivo',
      );
    } finally {
      stream.destroy();
    }
    if (validateCourseFile(name, Buffer.concat(chunks), size) !== mimeType)
      throw new BadRequestException('El formato no coincide con el contenido');
  }
}
