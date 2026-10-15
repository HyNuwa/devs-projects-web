import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { isBlockedAddress } from './blocked-address';
import { PlanReadingError } from './plan-reading.errors';
import { safeFetch, type SafeFetchOptions } from './safe-fetch';

/**
 * A local server stands in for the facultad site. The transport is plain
 * http and loopback is allowed only here; everything else is checked as in
 * production.
 */
describe('safeFetch', () => {
  let server: Server;
  let base: string;
  const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(100, 1)]);

  beforeAll(async () => {
    server = createServer((req, res) => {
      const path = req.url ?? '/';
      if (path === '/plan.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<h1>Plan</h1>');
      } else if (path === '/plan.pdf') {
        res.writeHead(200, { 'content-type': 'application/pdf' });
        res.end(pdf);
      } else if (path === '/octet') {
        res.writeHead(200, { 'content-type': 'application/octet-stream' });
        res.end(pdf);
      } else if (path === '/image') {
        res.writeHead(200, { 'content-type': 'image/png' });
        res.end('png');
      } else if (path === '/big') {
        res.writeHead(200, { 'content-type': 'application/pdf' });
        res.write(Buffer.alloc(600, 1));
        res.end(Buffer.alloc(600, 1));
      } else if (path.startsWith('/hop/')) {
        const left = Number(path.slice(5));
        res.writeHead(302, {
          location: left === 0 ? '/plan.pdf' : `/hop/${left - 1}`,
        });
        res.end();
      } else if (path === '/to-private') {
        res.writeHead(301, { location: 'https://10.0.0.7/plan.pdf' });
        res.end();
      } else if (path === '/to-http') {
        res.writeHead(301, { location: 'http://example.com/plan.pdf' });
        res.end();
      } else if (path === '/bad-location') {
        res.writeHead(302, { location: 'https://[' });
        res.end();
      } else if (path === '/latin') {
        res.writeHead(200, { 'content-type': 'text/html; charset=ISO-8859-1' });
        res.end('<p>hola</p>');
      } else if (path === '/missing') {
        res.writeHead(404);
        res.end();
      } else if (path === '/slow') {
        // Never answers.
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    base = `https://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  const options: SafeFetchOptions = {
    transport: request,
    isBlocked: (address) =>
      address !== '127.0.0.1' && address !== '::1' && isBlockedAddress(address),
    timeoutMs: 1_000,
    maxBytes: 1_000,
  };
  const code = (promise: Promise<unknown>) =>
    promise.then(
      () => 'ok',
      (error: unknown) =>
        error instanceof PlanReadingError ? error.code : error,
    );

  it('reads an HTML page and a PDF', async () => {
    const html = await safeFetch(`${base}/plan.html`, options);
    expect(html.kind).toBe('html');
    expect(html.body.toString()).toBe('<h1>Plan</h1>');
    const file = await safeFetch(`${base}/plan.pdf`, options);
    expect(file).toMatchObject({ kind: 'pdf', url: `${base}/plan.pdf` });
    expect(file.body.equals(pdf)).toBe(true);
  });

  it('takes a PDF sent as octet-stream by its signature', async () => {
    expect((await safeFetch(`${base}/octet`, options)).kind).toBe('pdf');
  });

  it('follows up to 3 redirects and reports the final address', async () => {
    const file = await safeFetch(`${base}/hop/2`, options);
    expect(file.url).toBe(`${base}/plan.pdf`);
    expect(await code(safeFetch(`${base}/hop/3`, options))).toBe(
      'PLAN_UNREACHABLE',
    );
  });

  it('refuses http, private addresses and redirects to them', async () => {
    expect(await code(safeFetch('http://example.com/plan.pdf', options))).toBe(
      'PLAN_URL_FORBIDDEN',
    );
    expect(
      await code(safeFetch('https://192.168.0.10/plan.pdf', options)),
    ).toBe('PLAN_URL_FORBIDDEN');
    expect(await code(safeFetch(`${base}/to-private`, options))).toBe(
      'PLAN_URL_FORBIDDEN',
    );
    expect(await code(safeFetch(`${base}/to-http`, options))).toBe(
      'PLAN_URL_FORBIDDEN',
    );
  });

  it('refuses a host that resolves to a blocked address', async () => {
    expect(
      await code(
        safeFetch(`${base}/plan.pdf`, {
          ...options,
          isBlocked: isBlockedAddress,
        }),
      ),
    ).toBe('PLAN_URL_FORBIDDEN');
  });

  it('stops a body over the size cap', async () => {
    expect(await code(safeFetch(`${base}/big`, options))).toBe(
      'PLAN_TOO_LARGE',
    );
  });

  it('refuses other content types', async () => {
    expect(await code(safeFetch(`${base}/image`, options))).toBe(
      'PLAN_UNSUPPORTED_TYPE',
    );
  });

  it('reports error statuses and timeouts as unreachable', async () => {
    expect(await code(safeFetch(`${base}/missing`, options))).toBe(
      'PLAN_UNREACHABLE',
    );
    expect(
      await code(safeFetch(`${base}/slow`, { ...options, timeoutMs: 200 })),
    ).toBe('PLAN_UNREACHABLE');
  });

  it('reports a malformed redirect as unreachable', async () => {
    expect(await code(safeFetch(`${base}/bad-location`, options))).toBe(
      'PLAN_UNREACHABLE',
    );
  });

  it('reports the charset of an HTML page', async () => {
    const page = await safeFetch(`${base}/latin`, options);
    expect(page.charset).toBe('iso-8859-1');
    expect((await safeFetch(`${base}/plan.html`, options)).charset).toBe(
      'utf-8',
    );
  });
});
