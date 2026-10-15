import { describe, expect, it } from 'vitest';

import { decodeHtml, htmlToText } from './html-to-text';

const page = `<!doctype html>
<html><head><title>Licenciatura en Física</title>
<style>.x { color: red }</style>
<script>window.evil = "Análisis Oculto";</script></head>
<body>
<header><a href="/">Inicio</a></header>
<nav><ul><li>Menú Institucional</li></ul></nav>
<main>
  <h1>Licenciatura en F&iacute;sica</h1>
  <p>Plan de estudios &mdash; resoluci&oacute;n 123/2023 &amp; anexos</p>
  <table>
    <tr><th>Año</th><th>Materia</th><th>Régimen</th></tr>
    <tr><td>1</td><td>Análisis Matemático I</td><td>1.º cuatrimestre</td></tr>
  </table>
  <ul><li>Física General</li><li>Química</li></ul>
  <a href="/docs/plan-2023.pdf">Plan 2023 (PDF)</a>
  <a href="https://otro.edu.ar/descargar?id=7">Descargar plan de estudios</a>
  <a href="http://inseguro.edu.ar/plan.pdf">Plan viejo</a>
  <a href="/noticias">Noticias</a>
  <a href="javascript:alert(1)">plan.pdf</a>
</main>
<footer>Copyright</footer>
<svg><text>Logo</text></svg>
</body></html>`;

describe('htmlToText', () => {
  const result = htmlToText(page, 'https://exactas.unsa.edu.ar/carreras/lf');

  it('keeps headings, paragraphs, lists and table rows, with entities decoded', () => {
    expect(result.text).toContain('Licenciatura en Física');
    expect(result.text).toContain(
      'Plan de estudios — resolución 123/2023 & anexos',
    );
    expect(result.text).toContain(
      '1 | Análisis Matemático I | 1.º cuatrimestre',
    );
    expect(result.text).toContain('- Física General');
  });

  it('drops scripts, styles, navigation, header, footer and svg', () => {
    for (const hidden of [
      'Análisis Oculto',
      'color: red',
      'Menú Institucional',
      'Inicio',
      'Copyright',
      'Logo',
    ]) {
      expect(result.text).not.toContain(hidden);
    }
  });

  it('collects absolute https links that look like the plan, with their text', () => {
    expect(result.links).toEqual([
      {
        url: 'https://exactas.unsa.edu.ar/docs/plan-2023.pdf',
        text: 'Plan 2023 (PDF)',
      },
      {
        url: 'https://otro.edu.ar/descargar?id=7',
        text: 'Descargar plan de estudios',
      },
    ]);
  });

  it('keeps at most 30 links and caps the text', () => {
    const many = Array.from(
      { length: 40 },
      (_, i) => `<a href="/p${i}.pdf">PDF ${i}</a>`,
    ).join('');
    const long = `<p>${'materia '.repeat(50_000)}</p>`;
    const capped = htmlToText(many + long, 'https://x.edu.ar/');
    expect(capped.links).toHaveLength(30);
    expect(capped.text.length).toBeLessThanOrEqual(200_000);
  });

  it('caps the text of each link', () => {
    const [link] = htmlToText(
      `<a href="/plan.pdf">${'Plan '.repeat(200)}</a>`,
      'https://x.edu.ar/',
    ).links;
    expect(link.text.length).toBeLessThanOrEqual(200);
  });

  it.each([
    ['lone brackets', '<'.repeat(400_000)],
    ['unclosed scripts', '<script>'.repeat(100_000)],
    ['unclosed comments', '<!--'.repeat(100_000)],
    ['unclosed links', '<a href="/plan.pdf">'.repeat(60_000)],
    ['unclosed list items', '<li'.repeat(200_000)],
    ['long entities', `&${'a'.repeat(500_000)}`.repeat(4)],
  ])('stays fast on hostile HTML: %s', (_name, html) => {
    const started = Date.now();
    htmlToText(html, 'https://x.edu.ar/');
    expect(Date.now() - started).toBeLessThan(1_500);
  });
});

describe('decodeHtml', () => {
  const latin1 = Buffer.from('<p>Análisis Matemático</p>', 'latin1');

  it('uses the charset of the Content-Type header', () => {
    expect(decodeHtml(latin1, 'ISO-8859-1')).toBe('<p>Análisis Matemático</p>');
  });

  it('falls back to a meta charset, then to UTF-8', () => {
    const meta = Buffer.concat([
      Buffer.from('<meta charset="windows-1252">'),
      latin1,
    ]);
    expect(decodeHtml(meta, null)).toContain('Análisis Matemático');
    expect(decodeHtml(Buffer.from('<p>Física</p>'), null)).toBe(
      '<p>Física</p>',
    );
    expect(decodeHtml(Buffer.from('<p>Física</p>'), 'no-such-charset')).toBe(
      '<p>Física</p>',
    );
  });
});
