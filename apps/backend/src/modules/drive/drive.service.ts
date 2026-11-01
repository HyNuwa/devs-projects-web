import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';
import { createPrivateKey } from 'node:crypto';

export const MAX_COURSE_FILE_SIZE = 25 * 1024 * 1024;
export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}
const ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

@Injectable()
export class DriveService {
  private client?: drive_v3.Drive;
  private readonly rootId: string;
  private readonly sharedDriveId: string;
  private readonly credentials?: { client_email: string; private_key: string };

  constructor(config: ConfigService) {
    this.rootId = config.get<string>('GOOGLE_DRIVE_FOLDER_ID', '');
    this.sharedDriveId = config.get<string>('GOOGLE_DRIVE_SHARED_DRIVE_ID', '');
    const json = config.get<string>('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON', '');
    if (!this.rootId && !this.sharedDriveId && !json) return;
    try {
      const value = JSON.parse(json) as Record<string, unknown>;
      if (
        !ID_PATTERN.test(this.rootId) ||
        !ID_PATTERN.test(this.sharedDriveId) ||
        typeof value.client_email !== 'string' ||
        typeof value.private_key !== 'string' ||
        !value.private_key.includes('PRIVATE KEY')
      )
        throw new Error();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.client_email))
        throw new Error();
      if (createPrivateKey(value.private_key).asymmetricKeyType !== 'rsa')
        throw new Error();
      this.credentials = {
        client_email: value.client_email,
        private_key: value.private_key,
      };
    } catch {
      throw new Error('Configuración de Google Drive incompleta o inválida');
    }
  }
  get isConfigured(): boolean {
    return !!this.credentials;
  }
  validateId(id: string): void {
    if (!ID_PATTERN.test(id))
      throw new BadRequestException('Identificador de Drive inválido');
  }
  async ready(): Promise<void> {
    const drive = await this.getClient();
    await this.call(async () => {
      const { data } = await drive.files.get({
        fileId: this.rootId,
        fields: 'id,mimeType,driveId,trashed',
        supportsAllDrives: true,
      });
      if (
        data.trashed ||
        data.mimeType !== 'application/vnd.google-apps.folder' ||
        data.driveId !== this.sharedDriveId
      )
        throw new ServiceUnavailableException(
          'La raíz de Drive no está disponible',
        );
      await this.assertPrivate(this.rootId, drive);
    });
  }
  async browse(folderId = this.rootId, pageSize = 50, pageToken?: string) {
    this.validateId(folderId);
    await this.ready();
    const drive = await this.getClient();
    return this.call(async () => {
      await this.assertUnderRoot(folderId, drive);
      const { data } = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        pageSize,
        pageToken,
        corpora: 'drive',
        driveId: this.sharedDriveId,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        fields: 'nextPageToken,files(id,name,mimeType,size)',
      });
      return {
        files: data.files ?? [],
        nextPageToken: data.nextPageToken ?? null,
      };
    });
  }
  async metadata(fileId: string): Promise<DriveFileMetadata> {
    this.validateId(fileId);
    await this.ready();
    const drive = await this.getClient();
    return this.call(async () => {
      await this.assertUnderRoot(fileId, drive);
      await this.assertPrivate(fileId, drive);
      const { data } = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,trashed',
        supportsAllDrives: true,
      });
      if (
        data.trashed ||
        !data.id ||
        !data.name ||
        !data.mimeType ||
        !data.size
      )
        throw new NotFoundException('Archivo no disponible');
      const size = Number(data.size);
      if (
        !Number.isSafeInteger(size) ||
        size < 1 ||
        size > MAX_COURSE_FILE_SIZE
      )
        throw new BadRequestException('Tamaño de archivo no permitido');
      return { id: data.id, name: data.name, mimeType: data.mimeType, size };
    });
  }
  async upload(
    openBody: () => Readable,
    metadata: { name: string; mimeType: string; operationId: string },
  ): Promise<string> {
    await this.ready();
    const drive = await this.getClient();
    return this.call(async () => {
      const body = openBody();
      try {
        const { data } = await drive.files.create({
          supportsAllDrives: true,
          requestBody: {
            name: metadata.name,
            parents: [this.rootId],
            mimeType: metadata.mimeType,
            appProperties: { operationId: metadata.operationId },
          },
          media: { mimeType: metadata.mimeType, body },
          fields: 'id',
        });
        if (!data.id)
          throw new BadGatewayException('No se pudo guardar el archivo');
        return data.id;
      } finally {
        body.destroy();
      }
    });
  }
  async findOperation(operationId: string): Promise<string | null> {
    if (!/^[0-9a-f-]{36}$/i.test(operationId)) throw new BadRequestException();
    await this.ready();
    const drive = await this.getClient();
    return this.call(async () => {
      const { data } = await drive.files.list({
        q: `'${this.rootId}' in parents and trashed = false and appProperties has { key='operationId' and value='${operationId}' }`,
        corpora: 'drive',
        driveId: this.sharedDriveId,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        fields: 'files(id)',
        pageSize: 2,
      });
      if ((data.files?.length ?? 0) > 1)
        throw new BadGatewayException('Operación duplicada en almacenamiento');
      return data.files?.[0]?.id ?? null;
    });
  }
  async media(fileId: string, range?: string): Promise<Readable> {
    const drive = await this.getClient();
    return this.call(async () => {
      const response = await drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        {
          responseType: 'stream',
          headers: range ? { Range: range } : undefined,
        },
      );
      if (range && response.status !== 206) {
        response.data.destroy();
        throw new BadGatewayException(
          'El proveedor no respetó el rango solicitado',
        );
      }
      return response.data;
    });
  }
  async removeOwned(fileId: string, operationId: string): Promise<void> {
    await this.ready();
    const drive = await this.getClient();
    await this.call(async () => {
      const { data } = await drive.files.get({
        fileId,
        fields: 'appProperties',
        supportsAllDrives: true,
      });
      if (data.appProperties?.operationId !== operationId)
        throw new BadGatewayException('Archivo ajeno a la operación');
      await this.assertUnderRoot(fileId, drive);
      await drive.files.delete({ fileId, supportsAllDrives: true });
    });
  }
  private async getClient(): Promise<drive_v3.Drive> {
    if (!this.credentials)
      throw new ServiceUnavailableException('Google Drive no está configurado');
    if (!this.client) {
      const { google } = await import('googleapis');
      const auth = new google.auth.GoogleAuth({
        credentials: this.credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      this.client = google.drive({
        version: 'v3',
        auth,
        timeout: 30000,
        retry: false,
      });
    }
    return this.client;
  }
  private async assertUnderRoot(
    fileId: string,
    drive: drive_v3.Drive,
  ): Promise<void> {
    let current = fileId;
    const seen = new Set<string>();
    for (let depth = 0; depth < 30; depth++) {
      if (current === this.rootId) return;
      if (seen.has(current)) break;
      seen.add(current);
      const { data } = await drive.files.get({
        fileId: current,
        fields: 'parents,trashed,mimeType,driveId',
        supportsAllDrives: true,
      });
      if (
        data.trashed ||
        data.driveId !== this.sharedDriveId ||
        data.mimeType === 'application/vnd.google-apps.shortcut' ||
        data.parents?.length !== 1
      )
        break;
      current = data.parents[0];
    }
    throw new NotFoundException('Archivo fuera de la raíz configurada');
  }
  private async assertPrivate(
    fileId: string,
    drive: drive_v3.Drive,
  ): Promise<void> {
    let pageToken: string | undefined;
    for (let page = 0; page < 10; page++) {
      const { data } = await drive.permissions.list({
        fileId,
        supportsAllDrives: true,
        pageSize: 100,
        pageToken,
        fields: 'nextPageToken,permissions(type)',
      });
      if (
        data.permissions?.some(
          (p) => p.type === 'anyone' || p.type === 'domain',
        )
      )
        throw new BadRequestException('La carpeta o archivo debe ser privado');
      if (!data.nextPageToken) return;
      pageToken = data.nextPageToken;
    }
    throw new BadGatewayException(
      'No se pudo comprobar la privacidad del archivo',
    );
  }
  private async call<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) throw new NotFoundException('Archivo no disponible');
      if (status === 429 || !status || status >= 500)
        throw new ServiceUnavailableException(
          'Almacenamiento temporalmente no disponible',
        );
      throw new BadGatewayException(
        'El proveedor de almacenamiento rechazó la operación',
      );
    }
  }
}
