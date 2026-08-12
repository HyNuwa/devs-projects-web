import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import {
  FileStorageService,
  StagedFile,
  PublishedFile,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from './file-storage.service';

/**
 * Proveedor de Google Drive mediante service account.
 * Solo se activa si GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON y GOOGLE_DRIVE_FOLDER_ID
 * están configurados. Si no, el módulo usa LocalFileStorageService.
 */
@Injectable()
export class GoogleDriveStorageService implements FileStorageService {
  private readonly logger = new Logger(GoogleDriveStorageService.name);
  private readonly stagingDir: string;
  private readonly folderId: string;
  private readonly serviceAccountJson: string;
  private drive: any = null;

  constructor(private configService: ConfigService) {
    this.stagingDir = path.join(
      process.cwd(),
      'storage',
      'staging',
      'materials',
    );
    this.folderId = this.configService.get<string>(
      'GOOGLE_DRIVE_FOLDER_ID',
      '',
    );
    this.serviceAccountJson = this.configService.get<string>(
      'GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON',
      '',
    );
    void this.ensureDirectory();
  }

  get isConfigured(): boolean {
    return Boolean(this.folderId && this.serviceAccountJson);
  }

  private async ensureDirectory() {
    try {
      await fs.mkdir(this.stagingDir, { recursive: true });
    } catch (err) {
      this.logger.error('Error creando directorio de staging', err);
    }
  }

  private async getDrive() {
    if (this.drive) return this.drive;
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Google Drive no está configurado en el servidor',
      );
    }

    try {
      // Carga dinámica para no romper el build si googleapis no está instalado.
      const { google } = await import('googleapis');
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(this.serviceAccountJson),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      this.drive = google.drive({ version: 'v3', auth });
      return this.drive;
    } catch (err) {
      this.logger.error('Error inicializando Google Drive', err);
      throw new ServiceUnavailableException(
        'No se pudo inicializar Google Drive',
      );
    }
  }

  async stage(file: Express.Multer.File): Promise<StagedFile> {
    await this.ensureDirectory();
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${ext || 'desconocido'}. Extensiones válidas: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        'El archivo excede el tamaño máximo permitido de 25MB',
      );
    }

    const filename = `${randomUUID()}.${ext}`;
    const stagedPath = path.join(this.stagingDir, filename);
    await fs.writeFile(stagedPath, file.buffer);

    return {
      stagedPath,
      fileType: ext,
      fileSize: file.size,
      thumbnailUrl: null,
    };
  }

  async publish(
    stagedPath: string,
    metadata: { fileType: string },
  ): Promise<PublishedFile> {
    const drive = await this.getDrive();
    const ext = metadata.fileType || path.extname(stagedPath).replace('.', '');
    const mimeType = this.mimeFor(ext);

    const fileBuffer = await fs.readFile(stagedPath);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const res = await drive.files.create({
      requestBody: {
        name: `${randomUUID()}.${ext}`,
        parents: [this.folderId],
        mimeType,
      },
      media: {
        mimeType,
        body: fileBuffer,
      },
      fields: 'id,name,mimeType,webViewLink',
    });

    const fileId = res.data.id as string;

    // Hacer el archivo visible por enlace para preview/descarga.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    await fs.unlink(stagedPath).catch(() => undefined);

    return {
      fileUrl: this.getDownloadUrl(fileId),
      driveFileId: fileId,
      drivePreviewUrl: this.getPreviewUrl(fileId),
      driveDownloadUrl: this.getDownloadUrl(fileId),
    };
  }

  async discard(stagedPath: string): Promise<void> {
    if (!stagedPath) return;
    await fs.unlink(stagedPath).catch(() => undefined);
  }

  getPreviewUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  getDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }

  async importFromFolder(folderId: string): Promise<unknown> {
    const drive = await this.getDrive();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,size)',
      pageSize: 100,
    });
    return res.data.files ?? [];
  }

  private mimeFor(ext: string): string {
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xls: 'application/vnd.ms-excel',
      txt: 'text/plain',
      md: 'text/markdown',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    return map[ext] ?? 'application/octet-stream';
  }
}
