import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { MailService, escapeHtml } from './mail.service';

describe('escapeHtml', () => {
  it('escapes markup written by people', () => {
    expect(escapeHtml(`<b>"Física" & 'Química'</b>`)).toBe(
      '&lt;b&gt;&quot;Física&quot; &amp; &#39;Química&#39;&lt;/b&gt;',
    );
  });
});

describe('career request emails', () => {
  const service = () => {
    const config = {
      get: (_key: string, fallback?: unknown) => fallback,
    } as ConfigService;
    const mail = new MailService(config);
    const send = vi
      .spyOn(
        mail as unknown as {
          send: (to: string, subject: string, html: string) => Promise<void>;
        },
        'send',
      )
      .mockResolvedValue();
    return { mail, send };
  };

  it('escapes the carrera name and the reason of a rejection', async () => {
    const { mail, send } = service();
    await mail.sendCareerRequestRejected(
      'a@x.test',
      'ana',
      '<i>Física</i>',
      'No <script>',
    );
    const html = send.mock.calls[0][2];
    expect(html).toContain('&lt;i&gt;Física&lt;/i&gt;');
    expect(html).toContain('No &lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('links the published carrera and Mi carrera', async () => {
    const { mail, send } = service();
    await mail.sendCareerPublished(
      'a@x.test',
      'ana',
      'Física',
      '/universidades/unsa/fce/lf',
    );
    const html = send.mock.calls[0][2];
    expect(html).toContain('http://localhost:3000/universidades/unsa/fce/lf');
    expect(html).toContain('http://localhost:3000/profile/me#mi-carrera');
  });
});
