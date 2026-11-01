import { ConfigService } from '@nestjs/config';
import { DriveService } from './drive.service';
import { generateKeyPairSync } from 'node:crypto';
import { Readable } from 'node:stream';

describe('Drive server configuration', () => {
  it('is explicitly unavailable when no configuration exists', async () => {
    const service = new DriveService(new ConfigService({}));
    expect(service.isConfigured).toBe(false);
    await expect(service.ready()).rejects.toThrow(
      'Google Drive no está configurado',
    );
  });
  it('rejects partial and malformed configuration without echoing secrets', () => {
    expect(
      () =>
        new DriveService(
          new ConfigService({ GOOGLE_DRIVE_FOLDER_ID: 'folder' }),
        ),
    ).toThrow('Configuración de Google Drive incompleta o inválida');
    expect(
      () =>
        new DriveService(
          new ConfigService({
            GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: 'secret-not-json',
          }),
        ),
    ).toThrow('Configuración de Google Drive incompleta o inválida');
  });
  it('rejects query injection identifiers', () => {
    const service = new DriveService(new ConfigService({}));
    expect(() => service.validateId("x' or trashed=true")).toThrow();
  });
  it('rejects text pretending to be a PEM key at startup', () => {
    expect(
      () =>
        new DriveService(
          new ConfigService({
            GOOGLE_DRIVE_FOLDER_ID: 'root',
            GOOGLE_DRIVE_SHARED_DRIVE_ID: 'shared',
            GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: JSON.stringify({
              client_email: 'service@example.test',
              private_key: 'PRIVATE KEY',
            }),
          }),
        ),
    ).toThrow('Configuración de Google Drive incompleta o inválida');
  });
});

describe('Drive adapter privacy and scope', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const client = {
    files: {
      get: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    permissions: { list: jest.fn() },
  };
  let service: DriveService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new DriveService(
      new ConfigService({
        GOOGLE_DRIVE_FOLDER_ID: 'root',
        GOOGLE_DRIVE_SHARED_DRIVE_ID: 'shared',
        GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: JSON.stringify({
          client_email: 'service@example.test',
          private_key: privateKey,
        }),
      }),
    );
    Object.assign(service, { client });
    client.files.get.mockResolvedValue({
      data: {
        id: 'root',
        mimeType: 'application/vnd.google-apps.folder',
        driveId: 'shared',
      },
    });
    client.permissions.list.mockResolvedValue({ data: { permissions: [] } });
  });
  it('preserves pagination and restricts listing to the shared drive', async () => {
    client.files.list.mockResolvedValue({
      data: { files: [{ id: 'file' }], nextPageToken: 'next' },
    });
    await expect(service.browse(undefined, 10)).resolves.toEqual({
      files: [{ id: 'file' }],
      nextPageToken: 'next',
    });
    expect(client.files.list).toHaveBeenCalledWith(
      expect.objectContaining({
        driveId: 'shared',
        corpora: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      }),
    );
  });
  it('rejects a public root and external ancestry', async () => {
    client.permissions.list.mockResolvedValueOnce({
      data: { permissions: [{ type: 'anyone' }] },
    });
    await expect(service.ready()).rejects.toThrow('debe ser privado');
    client.files.get
      .mockResolvedValueOnce({
        data: {
          id: 'root',
          mimeType: 'application/vnd.google-apps.folder',
          driveId: 'shared',
        },
      })
      .mockResolvedValueOnce({
        data: { driveId: 'external', parents: ['other'] },
      });
    await expect(service.metadata('external_file')).rejects.toThrow(
      'fuera de la raíz',
    );
  });
  it('uploads a private file with a recoverable operation identifier', async () => {
    client.files.create.mockResolvedValue({ data: { id: 'new_file' } });
    await expect(
      service.upload(() => Readable.from(Buffer.from('%PDF-')), {
        name: 'notes.pdf',
        mimeType: 'application/pdf',
        operationId: 'op',
      }),
    ).resolves.toBe('new_file');
    expect(client.files.create).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          parents: ['root'],
          appProperties: { operationId: 'op' },
        }),
      }),
    );
    expect(Object.keys(client.permissions)).toEqual(['list']);
  });
  it('sanitizes provider failures', async () => {
    client.files.get.mockRejectedValue({
      response: { status: 429, data: { secret: 'credential' } },
    });
    await expect(service.ready()).rejects.toThrow(
      'temporalmente no disponible',
    );
  });
});
