import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as path from 'path';

import { MAX_FILE_SIZE } from './file-storage.service';

export const ALLOWED_MATERIAL_TYPES = [
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

/** Multer options shared by every endpoint that receives a material file. */
export const materialUploadOptions: MulterOptions = {
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!ALLOWED_MATERIAL_TYPES.includes(ext)) {
      return cb(
        new BadRequestException(
          `Tipo de archivo no permitido. Extensiones válidas: ${ALLOWED_MATERIAL_TYPES.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE },
};
