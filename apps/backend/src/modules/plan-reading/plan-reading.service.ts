import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { decodeHtml, htmlToText } from './html-to-text';
import { PlanFetcher } from './plan-fetcher';
import { buildLines } from './plan-lines';
import { PlanModel, type ModelOutput, type PlanModelInput } from './plan-model';
import { PlanReadingError } from './plan-reading.errors';
import { PlanReadingLimits } from './plan-reading.limits';
import type { FetchedPlan } from './safe-fetch';

/** Argentina has no daylight saving time: its day starts at 03:00 UTC. */
const ARGENTINA_OFFSET_MS = 3 * 3_600_000;

export type PlanReading = {
  text: string;
  notices: string[];
  sources: { url: string; kind: 'html' | 'pdf' }[];
};

/** `linked`: the plan a page pointed to, page or PDF. */
type Trace = { linked: string | null; sources: PlanReading['sources'] };

export function startOfArgentinaDay(now: Date) {
  const local = new Date(now.getTime() - ARGENTINA_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) +
      ARGENTINA_OFFSET_MS,
  );
}

/**
 * Lectura del plan (openspec academic-structure/plan-reading): reads a
 * carrera en borrador's plan link and returns carga masiva text. It never
 * writes the catálogo; it only records the lectura in the history.
 */
@Injectable()
export class PlanReadingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly fetcher: PlanFetcher,
    private readonly model: PlanModel,
    private readonly limits: PlanReadingLimits,
  ) {}

  async read(actorId: string, careerId: string): Promise<PlanReading> {
    const career = await this.prisma.career.findUnique({
      where: { id: careerId },
      select: {
        name: true,
        status: true,
        planUrl: true,
        faculty: {
          select: { name: true, university: { select: { name: true } } },
        },
      },
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    if (career.status === 'PUBLISHED') {
      throw new ConflictException({
        code: 'CAREER_PUBLISHED',
        message: 'La lectura del plan es solo para carreras en borrador.',
      });
    }
    if (!career.planUrl) {
      throw new ConflictException({
        code: 'NO_PLAN_URL',
        message: 'Agregá el link al plan oficial de la carrera primero.',
      });
    }
    await this.checkDailyLimit();

    const started = Date.now();
    const trace: Trace = { linked: null, sources: [] };
    const base = {
      career: career.name,
      faculty: career.faculty.name,
      university: career.faculty.university.name,
    };
    try {
      const output = await this.extract(career.planUrl, base, trace);
      const { text, lines, notices } = buildLines(
        output.materias,
        output.notices,
      );
      if (trace.linked) {
        notices.unshift(
          `Leí el plan desde el enlace de la página: ${trace.linked}`,
        );
      }
      await this.record(actorId, careerId, career.name, career.planUrl, {
        ...trace,
        lines,
        notices: notices.length,
        error: null,
        durationMs: Date.now() - started,
      });
      return { text, notices, sources: trace.sources };
    } catch (error) {
      // Every lectura is on record and counts for the daily limit, even one
      // that failed in a way nobody planned for (it still answers 500).
      const known = error instanceof PlanReadingError;
      await this.record(actorId, careerId, career.name, career.planUrl, {
        ...trace,
        lines: 0,
        notices: 0,
        error: known ? error.code : 'UNEXPECTED',
        durationMs: Date.now() - started,
      });
      throw known ? toHttp(error) : error;
    }
  }

  /**
   * Reads the link and, when it is a page without materias, at most one plan
   * it links to: a PDF or another page, whose own links are not offered.
   */
  private async extract(
    url: string,
    base: Omit<PlanModelInput, 'source'>,
    trace: Trace,
  ): Promise<ModelOutput> {
    const first = await this.fetch(url, trace);
    if (first.kind === 'pdf')
      return this.found(await this.readSource(first, base));

    const { text, links } = htmlToText(
      decodeHtml(first.body, first.charset),
      first.url,
    );
    const output = await this.model.extract({
      ...base,
      source: { kind: 'html', url: first.url, text, links },
    });
    if (output.materias.length > 0) return output;

    const link =
      output.planLinkIndex === null ? undefined : links[output.planLinkIndex];
    if (!link) throw new PlanReadingError('PLAN_NOT_FOUND');
    const linked = await this.fetch(link.url, trace);
    trace.linked = linked.url;
    return this.found(await this.readSource(linked, base));
  }

  /** A PDF as is, or a page as text without links, so it ends the search. */
  private readSource(
    fetched: FetchedPlan,
    base: Omit<PlanModelInput, 'source'>,
  ) {
    if (fetched.kind === 'pdf') {
      return this.model.extract({
        ...base,
        source: { kind: 'pdf', url: fetched.url, data: fetched.body },
      });
    }
    const { text } = htmlToText(
      decodeHtml(fetched.body, fetched.charset),
      fetched.url,
    );
    return this.model.extract({
      ...base,
      source: { kind: 'html', url: fetched.url, text, links: [] },
    });
  }

  private async fetch(url: string, trace: Trace): Promise<FetchedPlan> {
    const fetched = await this.fetcher.fetch(url);
    trace.sources.push({ url: fetched.url, kind: fetched.kind });
    return fetched;
  }

  private found(output: ModelOutput) {
    if (output.materias.length === 0) {
      throw new PlanReadingError('PLAN_NOT_FOUND');
    }
    return output;
  }

  /**
   * Counts today's lecturas. The count and the final record are not atomic,
   * so two lecturas at once can pass the limit by one: fine for a cost guard.
   */
  private async checkDailyLimit() {
    const today = await this.prisma.moderationEvent.count({
      where: {
        action: 'CATALOG_PLAN_READ',
        createdAt: { gte: startOfArgentinaDay(new Date()) },
      },
    });
    if (today >= this.limits.daily)
      throw toHttp(new PlanReadingError('DAILY_LIMIT'));
  }

  private record(
    actorId: string,
    careerId: string,
    label: string,
    url: string,
    result: {
      linked: string | null;
      lines: number;
      notices: number;
      error: string | null;
      durationMs: number;
    },
  ) {
    const { linked, lines, notices, error, durationMs } = result;
    return this.catalog.record(this.prisma, actorId, 'CATALOG_PLAN_READ', {
      kind: 'CAREER',
      id: careerId,
      label,
      before: null,
      after: {
        url,
        linked,
        model: this.model.name,
        lines,
        notices,
        error,
        durationMs,
      },
    });
  }
}

function toHttp(error: PlanReadingError) {
  const status =
    error.code === 'AI_QUOTA' || error.code === 'DAILY_LIMIT'
      ? HttpStatus.TOO_MANY_REQUESTS
      : HttpStatus.UNPROCESSABLE_ENTITY;
  return new HttpException(
    { code: error.code, message: error.message },
    status,
  );
}
