import type { PlanLink } from './html-to-text';

/** What the model reads: a cleaned page with its candidate links, or a PDF. */
export type PlanSource =
  | { kind: 'html'; url: string; text: string; links: PlanLink[] }
  | { kind: 'pdf'; url: string; data: Buffer };

export type PlanModelInput = {
  career: string;
  faculty: string;
  university: string;
  source: PlanSource;
};

/** One materia as the model reports it, before the server validates it. */
export type ModelMateria = {
  year: number | null;
  cuatrimestre: '1' | '2' | 'A' | null;
  optativa: boolean;
  nombre: string;
  creditos: number | null;
};

export type ModelOutput = {
  materias: ModelMateria[];
  notices: string[];
  /** For an HTML source without materias: the link that holds the plan. */
  planLinkIndex: number | null;
};

/**
 * The AI behind the lectura del plan. Gemini is the only implementation;
 * e2e tests replace it with a fake.
 */
export abstract class PlanModel {
  abstract readonly name: string;
  abstract extract(input: PlanModelInput): Promise<ModelOutput>;
}
