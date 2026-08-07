import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import * as sharpModule from 'sharp';
const sharp = sharpModule.default ?? sharpModule;

const ALLOWED_EXTENSIONS = [
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

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export interface StoredMaterialFile {
  fileUrl: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl: string | null;
}

@Injectable()
export class MaterialStorageService {
  private readonly logger = new Logger(MaterialStorageService.name);
  private readonly uploadDir: string;
  private readonly publicPath = '/uploads/materials';

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads', 'materials');
    void this.ensureDirectory();
  }

  private async ensureDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      this.logger.error('Error creando directorio de materiales', err);
    }
  }

  async save(file: Express.Multer.File): Promise<StoredMaterialFile> {
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
    const filePath = path.join(this.uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);

    let thumbnailUrl: string | null = null;
    if (IMAGE_EXTENSIONS.includes(ext)) {
      const thumbFilename = `${randomUUID()}.webp`;
      const thumbPath = path.join(this.uploadDir, thumbFilename);
      await sharp(file.buffer)
        .resize(400, 300, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbPath);
      thumbnailUrl = `${this.publicPath}/${thumbFilename}`;
    }

    return {
      fileUrl: `${this.publicPath}/${filename}`,
      fileType: ext,
      fileSize: file.size,
      thumbnailUrl,
    };
  }
}
