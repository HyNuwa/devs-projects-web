import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import * as sharpModule from 'sharp';
const sharp = sharpModule.default ?? sharpModule;

export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'pptx',
  'xls',
  'txt',
  'md',
  'jpg',
  'png',
  'webp',
];

const IMAGE_EXTENSIONS = ['jpg', 'png', 'webp'];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export interface StagedFile {
  stagedPath: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl: string | null;
}

export interface PublishedFile {
  fileUrl: string;
  driveFileId?: string;
  drivePreviewUrl?: string;
  driveDownloadUrl?: string;
}

/**
 * Abstracción de almacenamiento de archivos.
 * Permite cambiar el proveedor (local, Google Drive, Cloudflare R2 futuro)
 * sin tocar el dominio de materiales.
 */
export interface FileStorageService {
  /** Guarda el archivo en staging (temporal, no público). */
  stage(file: Express.Multer.File): Promise<StagedFile>;
  /** Mueve un archivo de staging al almacenamiento final (publicación). */
  publish(
    stagedPath: string,
    metadata: { fileType: string },
  ): Promise<PublishedFile>;
  /** Elimina un archivo de staging (rechazo o limpieza). */
  discard(stagedPath: string): Promise<void>;
  /** URL de previsualización para un fileId de Drive. */
  getPreviewUrl(fileId: string): string;
  /** URL de descarga para un fileId de Drive. */
  getDownloadUrl(fileId: string): string;
  /** Importa archivos existentes desde una carpeta de Drive. */
  importFromFolder(folderId: string): Promise<unknown>;
}

/**
 * Implementación local: staging en un directorio privado y publicación
 * en la carpeta pública del servidor. Es el proveedor por defecto y
 * funciona sin credenciales externas.
 */
@Injectable()
export class LocalFileStorageService implements FileStorageService {
  private readonly logger = new Logger(LocalFileStorageService.name);
  private readonly stagingDir: string;
  private readonly publicDir: string;
  private readonly publicPath = '/uploads/materials';

  constructor() {
    this.stagingDir = path.join(
      process.cwd(),
      'storage',
      'staging',
      'materials',
    );
    this.publicDir = path.join(process.cwd(), 'public', 'uploads', 'materials');
    void this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.stagingDir, { recursive: true });
      await fs.mkdir(this.publicDir, { recursive: true });
    } catch (err) {
      this.logger.error('Error creando directorios de storage', err);
    }
  }

  private validate(file: Express.Multer.File) {
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

    return ext;
  }

  async stage(file: Express.Multer.File): Promise<StagedFile> {
    await this.ensureDirectories();
    const ext = this.validate(file);

    const filename = `${randomUUID()}.${ext}`;
    const stagedPath = path.join(this.stagingDir, filename);
    await fs.writeFile(stagedPath, file.buffer);

    let thumbnailUrl: string | null = null;
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const thumbFilename = `${randomUUID()}.webp`;
      const thumbPath = path.join(this.stagingDir, thumbFilename);
      await sharp(file.buffer)
        .resize(400, 300, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbPath);
      thumbnailUrl = thumbFilename;
    }

    return {
      stagedPath,
      fileType: ext,
      fileSize: file.size,
      thumbnailUrl,
    };
  }

  async publish(
    stagedPath: string,
    metadata: { fileType: string },
  ): Promise<PublishedFile> {
    await this.ensureDirectories();
    const ext = metadata.fileType || path.extname(stagedPath).replace('.', '');
    const filename = `${randomUUID()}.${ext}`;
    const finalPath = path.join(this.publicDir, filename);

    await fs.copyFile(stagedPath, finalPath);
    await fs.unlink(stagedPath).catch(() => undefined);

    return {
      fileUrl: `${this.publicPath}/${filename}`,
    };
  }

  async discard(stagedPath: string): Promise<void> {
    if (!stagedPath) return;
    await fs.unlink(stagedPath).catch(() => undefined);
  }

  getPreviewUrl(_fileId: string): string {
    return '';
  }

  getDownloadUrl(_fileId: string): string {
    return '';
  }

  async importFromFolder(_folderId: string): Promise<unknown> {
    throw new BadRequestException(
      'La importación desde Google Drive requiere el proveedor de Drive configurado',
    );
  }
}
