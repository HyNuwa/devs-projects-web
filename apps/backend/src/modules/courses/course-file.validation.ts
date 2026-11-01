import { BadRequestException, HttpException } from '@nestjs/common';
import { extname } from 'node:path';
import { MAX_COURSE_FILE_SIZE } from '../drive/drive.service';

export function validateCourseFile(
  name: string,
  body: Buffer,
  size = body.length,
): string {
  if (!body.length || size < 1 || size > MAX_COURSE_FILE_SIZE)
    throw new BadRequestException('Archivo vacío o mayor a 25 MiB');
  const ext = extname(name).toLowerCase();
  if (ext === '.pdf' && body.subarray(0, 5).toString() === '%PDF-')
    return 'application/pdf';
  if (
    ['.jpg', '.jpeg'].includes(ext) &&
    body[0] === 0xff &&
    body[1] === 0xd8 &&
    body[2] === 0xff
  )
    return 'image/jpeg';
  if (
    ext === '.png' &&
    body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'image/png';
  if (
    ext === '.webp' &&
    body.subarray(0, 4).toString() === 'RIFF' &&
    body.subarray(8, 12).toString() === 'WEBP'
  )
    return 'image/webp';
  throw new BadRequestException(
    'El archivo debe ser PDF, JPEG, PNG o WebP y coincidir con su extensión',
  );
}
export function byteRange(
  value: string | undefined,
  size: number,
): { start: number; end: number } | null {
  if (!value) return null;
  const invalid = () => {
    throw new HttpException('Rango de bytes inválido', 416);
  };
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return invalid();
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return invalid();
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= size ||
    end < start
  )
    return invalid();
  return { start, end };
}
