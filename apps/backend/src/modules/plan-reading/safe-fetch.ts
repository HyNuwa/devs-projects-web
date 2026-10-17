import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import type { ClientRequest, IncomingMessage, RequestOptions } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP, type LookupFunction } from 'node:net';

import { isBlockedAddress } from './blocked-address';
import { PlanReadingError } from './plan-reading.errors';

export type FetchedPlan = {
  /** The address read, after redirects. */
  url: string;
  kind: 'html' | 'pdf';
  body: Buffer;
  /** The Content-Type charset of a page, lowercased, when it has one. */
  charset?: string | null;
};

export type SafeFetchOptions = {
  /** Tests pass plain `http.request` against a local server. */
  transport?: (
    options: RequestOptions,
    callback: (response: IncomingMessage) => void,
  ) => ClientRequest;
  isBlocked?: (address: string) => boolean;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
};

export const FETCH_TIMEOUT_MS = 20_000;
export const FETCH_MAX_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const forbidden = () => new PlanReadingError('PLAN_URL_FORBIDDEN');
const unreachable = () => new PlanReadingError('PLAN_UNREACHABLE');

/**
 * Downloads a plan the way openspec academic-structure/plan-reading allows:
 * https only, never to a blocked address (checked on the address the socket
 * connects to, so a DNS answer cannot change between check and use), at most
 * 3 redirects, a total deadline and a size cap, HTML or PDF only.
 */
export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {},
): Promise<FetchedPlan> {
  const {
    transport = httpsRequest,
    isBlocked = isBlockedAddress,
    timeoutMs = FETCH_TIMEOUT_MS,
    maxBytes = FETCH_MAX_BYTES,
    maxRedirects = MAX_REDIRECTS,
  } = options;
  const deadline = Date.now() + timeoutMs;

  let current = url;
  for (let redirects = 0; ; redirects += 1) {
    const target = parse(current);
    const host = target.hostname.replace(/^\[|\]$/g, '');
    if (isIP(host) && isBlocked(host)) throw forbidden();

    const result = await get(target, {
      transport,
      lookup: checkedLookup(isBlocked),
      remainingMs: deadline - Date.now(),
      maxBytes,
    });
    if ('location' in result) {
      if (redirects >= maxRedirects) throw unreachable();
      try {
        current = new URL(result.location, target).toString();
      } catch {
        throw unreachable();
      }
      continue;
    }
    return { url: target.toString(), ...result };
  }
}

function parse(url: string) {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    throw forbidden();
  }
  if (target.protocol !== 'https:' || target.username || target.password) {
    throw forbidden();
  }
  return target;
}

/** Resolves like the system does, refusing when any answer is blocked. */
function checkedLookup(
  isBlocked: (address: string) => boolean,
): LookupFunction {
  return (hostname, options, callback) => {
    dnsLookup(hostname, { all: true }, (error, addresses: LookupAddress[]) => {
      if (error) return callback(error, '', 4);
      if (
        addresses.length === 0 ||
        addresses.some((a) => isBlocked(a.address))
      ) {
        return callback(forbidden(), '', 4);
      }
      // Node passes `all` when it tries several address families.
      if (options.all) return callback(null, addresses);
      callback(null, addresses[0].address, addresses[0].family);
    });
  };
}

type GetResult =
  | { location: string }
  | { kind: 'html' | 'pdf'; body: Buffer; charset: string | null };

function get(
  target: URL,
  {
    transport,
    lookup,
    remainingMs,
    maxBytes,
  }: {
    transport: NonNullable<SafeFetchOptions['transport']>;
    lookup: LookupFunction;
    remainingMs: number;
    maxBytes: number;
  },
): Promise<GetResult> {
  if (remainingMs <= 0) return Promise.reject(unreachable());
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error: Error | null, value?: GetResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        req.destroy();
        reject(error);
      } else resolve(value!);
    };

    const req = transport(
      {
        host: target.hostname.replace(/^\[|\]$/g, ''),
        port: target.port || undefined,
        path: `${target.pathname}${target.search}`,
        method: 'GET',
        // A fresh socket per request, so every connection goes through `lookup`.
        agent: false,
        lookup,
        headers: {
          accept: 'text/html,application/pdf;q=0.9,*/*;q=0.1',
          'user-agent': 'DevsProject-LecturaDelPlan/1.0',
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume();
          return finish(null, { location: response.headers.location });
        }
        if (status < 200 || status >= 300) {
          response.resume();
          return finish(unreachable());
        }
        const contentType = response.headers['content-type'] ?? '';
        const charset =
          /;\s*charset\s*=\s*"?([\w-]{1,40})/i
            .exec(contentType)?.[1]
            ?.toLowerCase() ?? null;
        const type = contentType.split(';')[0].trim().toLowerCase();
        const declared =
          type === 'text/html' || type === 'application/xhtml+xml'
            ? 'html'
            : type === 'application/pdf'
              ? 'pdf'
              : type === 'application/octet-stream' || type === ''
                ? 'sniff'
                : null;
        if (!declared) {
          response.resume();
          return finish(new PlanReadingError('PLAN_UNSUPPORTED_TYPE'));
        }
        const length = Number(response.headers['content-length']);
        if (length > maxBytes) {
          response.resume();
          return finish(new PlanReadingError('PLAN_TOO_LARGE'));
        }

        const chunks: Buffer[] = [];
        let size = 0;
        response.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            return finish(new PlanReadingError('PLAN_TOO_LARGE'));
          }
          chunks.push(chunk);
        });
        response.on('error', () => finish(unreachable()));
        response.on('end', () => {
          const body = Buffer.concat(chunks);
          if (declared !== 'sniff') {
            return finish(null, { kind: declared, body, charset });
          }
          if (body.subarray(0, 5).toString('latin1') === '%PDF-') {
            return finish(null, { kind: 'pdf', body, charset: null });
          }
          finish(new PlanReadingError('PLAN_UNSUPPORTED_TYPE'));
        });
      },
    );
    const timer = setTimeout(() => finish(unreachable()), remainingMs);
    req.on('error', (error) =>
      finish(error instanceof PlanReadingError ? error : unreachable()),
    );
    req.end();
  });
}
