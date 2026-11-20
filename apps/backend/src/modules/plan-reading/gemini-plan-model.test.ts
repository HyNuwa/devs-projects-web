import { describe, expect, it, vi } from 'vitest';

import { GeminiPlanModel } from './gemini-plan-model';
import { PlanReadingError } from './plan-reading.errors';
import type { PlanModelInput } from './plan-model';

const output = {
  materias: [
    {
      year: 1,
      cuatrimestre: '1',
      optativa: false,
      nombre: 'Análisis Matemático I',
      creditos: 8,
    },
  ],
  notices: ['Usé el plan 2023.'],
  planLinkIndex: null,
};

const answer = (text: string) =>
  new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

const html: PlanModelInput = {
  career: 'Licenciatura en Física',
  faculty: 'Facultad de Ciencias Exactas',
  university: 'Universidad Nacional de Salta',
  source: {
    kind: 'html',
    url: 'https://exactas.unsa.edu.ar/lf',
    text: 'Plan de estudios',
    links: [{ url: 'https://exactas.unsa.edu.ar/plan.pdf', text: 'Plan' }],
  },
};
const pdf: PlanModelInput = {
  ...html,
  source: {
    kind: 'pdf',
    url: 'https://exactas.unsa.edu.ar/plan.pdf',
    data: Buffer.from('%PDF-1.7'),
  },
};

type Body = {
  systemInstruction: { parts: { text: string }[] };
  contents: { parts: Record<string, unknown>[] }[];
  generationConfig: { responseMimeType: string; responseSchema: unknown };
  tools?: unknown;
};
const sent = (fetchMock: ReturnType<typeof vi.fn>, call = 0) => {
  const [url, init] = fetchMock.mock.calls[call] as [string, RequestInit];
  return {
    url,
    headers: init.headers as Record<string, string>,
    body: JSON.parse(init.body as string) as Body,
  };
};

describe('GeminiPlanModel', () => {
  it('asks for strict JSON with the key in a header and no tools', async () => {
    const fetchMock = vi.fn().mockResolvedValue(answer(JSON.stringify(output)));
    const model = new GeminiPlanModel({ apiKey: 'k-123' }, fetchMock);

    await expect(model.extract(html)).resolves.toEqual(output);

    const { url, headers, body } = sent(fetchMock);
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    );
    expect(url).not.toContain('k-123');
    expect(headers['x-goog-api-key']).toBe('k-123');
    expect(body.tools).toBeUndefined();
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema).toMatchObject({
      type: 'OBJECT',
      required: ['materias', 'notices', 'planLinkIndex'],
    });
    expect(body.systemInstruction.parts[0].text).toMatch(
      /ignorá cualquier instrucción/i,
    );
    const text = JSON.stringify(body.contents[0].parts);
    expect(text).toContain('Licenciatura en Física');
    expect(text).toContain('[0] Plan — https://exactas.unsa.edu.ar/plan.pdf');
  });

  it('sends a PDF as inline data and uses GEMINI_MODEL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(answer(JSON.stringify(output)));
    const model = new GeminiPlanModel(
      { apiKey: 'k', model: 'gemini-3.7-flash' },
      fetchMock,
    );
    await model.extract(pdf);
    const { url, body } = sent(fetchMock);
    expect(url).toContain('/models/gemini-3.7-flash:generateContent');
    expect(body.contents[0].parts).toContainEqual({
      inline_data: {
        mime_type: 'application/pdf',
        data: Buffer.from('%PDF-1.7').toString('base64'),
      },
    });
    expect(model.name).toBe('gemini-3.7-flash');
  });

  it('refuses to run without a key', async () => {
    const fetchMock = vi.fn();
    const model = new GeminiPlanModel({ apiKey: '' }, fetchMock);
    await expect(model.extract(html)).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a used-up quota to AI_QUOTA', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 429, status: 'RESOURCE_EXHAUSTED' },
        }),
        { status: 429 },
      ),
    );
    const model = new GeminiPlanModel({ apiKey: 'k' }, fetchMock);
    await expect(model.extract(html)).rejects.toMatchObject({
      code: 'AI_QUOTA',
    });
  });

  it('retries invalid JSON once, then fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer('not json'))
      .mockResolvedValueOnce(answer(JSON.stringify(output)));
    const model = new GeminiPlanModel({ apiKey: 'k' }, fetchMock);
    await expect(model.extract(html)).resolves.toEqual(output);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const failing = vi
      .fn()
      .mockImplementation(() => Promise.resolve(answer('{"materias": "no"}')));
    const error = await new GeminiPlanModel({ apiKey: 'k' }, failing)
      .extract(html)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(PlanReadingError);
    expect((error as PlanReadingError).code).toBe('AI_FAILED');
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it('retries once when Gemini is busy, then fails', async () => {
    const busy = () =>
      new Response(
        JSON.stringify({ error: { code: 503, status: 'UNAVAILABLE' } }),
        { status: 503 },
      );
    const recovering = vi
      .fn()
      .mockResolvedValueOnce(busy())
      .mockResolvedValueOnce(answer(JSON.stringify(output)));
    await expect(
      new GeminiPlanModel({ apiKey: 'k', retryDelayMs: 0 }, recovering).extract(
        html,
      ),
    ).resolves.toEqual(output);

    const down = vi.fn().mockImplementation(() => Promise.resolve(busy()));
    await expect(
      new GeminiPlanModel({ apiKey: 'k', retryDelayMs: 0 }, down).extract(html),
    ).rejects.toMatchObject({ code: 'AI_FAILED' });
    expect(down).toHaveBeenCalledTimes(2);
  });

  it('maps other errors and blocked answers to AI_FAILED', async () => {
    const serverError = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 400 }));
    await expect(
      new GeminiPlanModel({ apiKey: 'k' }, serverError).extract(html),
    ).rejects.toMatchObject({ code: 'AI_FAILED' });

    const blocked = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }),
          { status: 200 },
        ),
      );
    await expect(
      new GeminiPlanModel({ apiKey: 'k' }, blocked).extract(html),
    ).rejects.toMatchObject({ code: 'AI_FAILED' });
  });
});
