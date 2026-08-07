import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as sharpModule from 'sharp';
const sharp = sharpModule.default ?? sharpModule;

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly uploadDir: string;
  private readonly publicPath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    this.publicPath = '/uploads/avatars';
    this.baseUrl = this.configService.get<string>(
      'app.corsOrigin',
      'http://localhost:3000',
    );
    void this.ensureDirectory();
  }

  private async ensureDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      this.logger.error('Error creando directorio de avatares', err);
    }
  }

  async processAndSave(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    await this.ensureDirectory();

    const filename = `${userId}.webp`;
    const filePath = path.join(this.uploadDir, filename);

    // Redimensionar a 256x256, convertir a WebP
    await sharp(file.buffer)
      .resize(256, 256, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toFile(filePath);

    return `${this.publicPath}/${filename}`;
  }

  getAvatarUrl(relativePath: string): string {
    return `${this.baseUrl}${relativePath}`;
  }
}
