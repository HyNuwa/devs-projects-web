/** A link on the page that may lead to the plan. */
export type PlanLink = { url: string; text: string };

export const TEXT_MAX = 200_000;
export const LINKS_MAX = 30;
export const LINK_TEXT_MAX = 200;
/** Facultad pages are well under this; the rest is never read. */
const HTML_MAX = 3_000_000;
/** How far after `<a …>` its closing tag is looked for. */
const LINK_WINDOW = 2_000;

/** Parts of a page that never hold the plan, or hold code instead of text. */
const DROPPED_OPEN =
  /<(script|style|noscript|template|iframe|svg|nav|header|footer)\b/gi;
const LINK_OPEN = /<a\b([^<>]*)>/gi;
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+))/i;
const LOOKS_LIKE_PLAN = /\.pdf(?:$|[?#])|plan|pdf/i;

const ACCENTED: Record<string, string> = {
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  ntilde: 'ñ',
  uuml: 'ü',
};
const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  ordm: 'º',
  ordf: 'ª',
  deg: '°',
  middot: '·',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  iquest: '¿',
  iexcl: '¡',
  ...ACCENTED,
  ...Object.fromEntries(
    Object.entries(ACCENTED).map(([name, char]) => [
      name[0].toUpperCase() + name.slice(1),
      char.toUpperCase(),
    ]),
  ),
};

function decode(text: string) {
  return text.replace(
    /&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{1,10});/gi,
    (entity, name: string) => {
      if (name[0] === '#') {
        const code =
          name[1] === 'x' || name[1] === 'X'
            ? parseInt(name.slice(2), 16)
            : parseInt(name.slice(1), 10);
        return code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : entity;
      }
      return NAMED[name] ?? entity;
    },
  );
}

// Every pattern below stops at the next `<`, so hostile pages stay linear.
const stripTags = (html: string) => html.replace(/<[^<>]*>/g, ' ');
const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Removes `<!-- … -->` and the dropped blocks, scanning forward once. */
function removeHidden(html: string) {
  const out: string[] = [];
  let lower = html.toLowerCase();
  let position = 0;
  for (;;) {
    const start = lower.indexOf('<!--', position);
    if (start === -1) break;
    out.push(html.slice(position, start));
    const end = lower.indexOf('-->', start + 4);
    // An unclosed comment hides the rest of the page, as in a browser.
    position = end === -1 ? html.length : end + 3;
  }
  out.push(html.slice(position));
  const visible = out.join(' ');

  const kept: string[] = [];
  lower = visible.toLowerCase();
  position = 0;
  DROPPED_OPEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DROPPED_OPEN.exec(visible))) {
    if (match.index < position) continue;
    kept.push(visible.slice(position, match.index));
    const close = lower.indexOf(`</${match[1].toLowerCase()}`, match.index);
    const end = close === -1 ? -1 : lower.indexOf('>', close);
    if (end === -1) {
      position = visible.length;
      break;
    }
    position = end + 1;
    DROPPED_OPEN.lastIndex = position;
  }
  kept.push(visible.slice(position));
  return kept.join(' ');
}

function planLinks(body: string, baseUrl: string): PlanLink[] {
  const links: PlanLink[] = [];
  const seen = new Set<string>();
  const lower = body.toLowerCase();
  LINK_OPEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LINK_OPEN.exec(body)) && links.length < LINKS_MAX) {
    const href = HREF.exec(match[1]);
    if (!href) continue;
    const from = match.index + match[0].length;
    const window = lower.slice(from, from + LINK_WINDOW);
    const close = window.indexOf('</a');
    const inner = body.slice(from, from + (close === -1 ? 0 : close));
    const text = squash(decode(stripTags(inner))).slice(0, LINK_TEXT_MAX);
    let url: URL;
    try {
      url = new URL(decode(href[1] ?? href[2] ?? href[3]), baseUrl);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:') continue;
    if (
      !LOOKS_LIKE_PLAN.test(url.pathname + url.search) &&
      !LOOKS_LIKE_PLAN.test(text)
    ) {
      continue;
    }
    url.hash = '';
    if (seen.has(url.href)) continue;
    seen.add(url.href);
    links.push({ url: url.href, text });
  }
  return links;
}

/**
 * Turns a facultad page into text the model can read, keeping headings,
 * paragraphs, list items and table rows (`a | b | c`), and collects the links
 * that may lead to the plan, absolute and https only.
 */
export function htmlToText(
  html: string,
  baseUrl: string,
): { text: string; links: PlanLink[] } {
  const body = removeHidden(html.slice(0, HTML_MAX));
  const links = planLinks(body, baseUrl);

  const text = decode(
    stripTags(
      body
        .replace(/<\/t[dh]\s*>\s*(?=<t[dh][\s>])/gi, ' | ')
        .replace(/<li\b[^<>]*>/gi, '\n- ')
        .replace(
          /<\/?(?:h[1-6]|p|div|tr|table|thead|tbody|ul|ol|section|article|main|br|dt|dd|caption)\b[^<>]*>/gi,
          '\n',
        ),
    ),
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && line !== '-')
    .join('\n')
    .slice(0, TEXT_MAX);

  return { text, links };
}

function decoder(label: string | null | undefined) {
  if (!label) return null;
  try {
    return new TextDecoder(label.trim().toLowerCase());
  } catch {
    return null;
  }
}

/**
 * Decodes a page with the charset of its Content-Type, else of a
 * `<meta charset>` near the top, else UTF-8: older facultad sites are often
 * ISO-8859-1.
 */
export function decodeHtml(body: Buffer, charset: string | null | undefined) {
  const head = body.subarray(0, 2048).toString('latin1');
  const meta = /<meta\b[^<>]*?charset\s*=\s*["']?([\w-]{1,40})/i.exec(head);
  return (decoder(charset) ?? decoder(meta?.[1]) ?? new TextDecoder()).decode(
    body,
  );
}
