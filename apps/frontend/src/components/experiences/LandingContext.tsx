'use client';

import { useId, useState } from 'react';
import { Building2, Info } from 'lucide-react';

import { UbicacionChip, UbicacionPanel } from '@/components/layout/UbicacionChip';
import { Button } from '@/components/ui/shadcn';
import type { CareerCard } from '@/lib/catalog-client';
import type { ExperiencesLandingState } from '@/lib/experiences-landing-state';
import type { Ubicacion } from '@/stores/ubicacionStore';
import { useUbicacionStore } from '@/stores/ubicacionStore';
import { cn } from '@/components/ui/shadcn/utils';

export type LandingKind = 'resenas' | 'finales' | null;

const chipClassName = (active: boolean) =>
  cn(
    'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] border-[1.5px] border-foreground px-3.5 font-sans text-[0.8125rem] font-extrabold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground',
  );

const typeSegments: { kind: LandingKind; label: string }[] = [
  { kind: null, label: 'Reseñas y finales' },
  { kind: 'resenas', label: 'Solo reseñas' },
  { kind: 'finales', label: 'Solo finales' },
];

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

/**
 * The landing's context block (openspec academic-community/experiences): the
 * facultad from the Ubicación with «Cambiar», the published carrera and año
 * chips and the type segment. Without an Ubicación it offers the same
 * selector `UbicacionChip` shows, and no carrera or año chips.
 */
export function LandingContext({
  browseFailed,
  careers,
  onRetryBrowse,
  onSelect,
  profileCareerId,
  state,
  ubicacion,
}: {
  /** Whether the facultad browse (carrera chips) failed; exposes a retry. */
  browseFailed?: boolean;
  careers: CareerCard[];
  onRetryBrowse?: () => void;
  /** Pushes a new landing state into the URL. */
  onSelect: (next: ExperiencesLandingState) => void;
  /** The signed-in student's carrera cursando in this facultad, when active. */
  profileCareerId: string | null;
  /** Effective state (profile preselect already folded into `careerId`). */
  state: ExperiencesLandingState;
  ubicacion: Ubicacion | null;
}) {
  const choose = useUbicacionStore((store) => store.choose);
  const titleId = useId();
  const [selectorOpen, setSelectorOpen] = useState(false);

  const selectedCareer = careers.find((career) => career.id === state.careerId);
  const maxYear =
    (state.careerId
      ? selectedCareer?.years
      : Math.max(0, ...careers.map((career) => career.years ?? 0))) ?? 0;

  return (
    <section
      aria-label="Contexto de la búsqueda"
      className="relative rounded-2xl border-[1.5px] border-foreground bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-sans text-base font-extrabold tracking-[-0.02em] text-card-foreground">
          ¿Qué estudiás?
        </span>
        {ubicacion ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 font-sans text-[0.8125rem] font-bold text-foreground">
              <Building2 aria-hidden="true" className="size-4 text-primary" strokeWidth={2} />
              {ubicacion.universityShortName} · {ubicacion.facultyShortName}
            </span>
            {profileCareerId && state.careerId === profileCareerId ? (
              <span className="text-xs font-semibold text-muted-foreground">
                tomado de tu perfil
              </span>
            ) : null}
            <button
              className="font-sans text-xs font-bold text-link underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
              onClick={() => setSelectorOpen(true)}
              type="button"
            >
              Cambiar
            </button>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Info aria-hidden="true" className="size-3.5" strokeWidth={2} />
              Lo recordamos en este dispositivo. Con tu cuenta se completa solo.
            </span>
          </>
        ) : (
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-sans text-sm font-semibold text-muted-foreground">
              Elegí tu facultad para ver las experiencias que te rodean.
            </span>
            <UbicacionChip />
          </span>
        )}
      </div>

      {ubicacion ? (
        <div className="mt-4 grid gap-3">
          {browseFailed ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-sans text-sm font-semibold text-muted-foreground">
                No pudimos cargar las carreras.
              </p>
              <Button onClick={onRetryBrowse} size="sm" variant="outline">
                Reintentar
              </Button>
            </div>
          ) : (
            <ChipRow label="Carrera">
              <button
                className={chipClassName(state.careerId === null)}
                onClick={() => onSelect({ ...state, allCareers: true, careerId: null, year: null })}
                type="button"
              >
                Todas
              </button>
              {careers.map((career) => (
                <button
                  aria-pressed={state.careerId === career.id}
                  className={chipClassName(state.careerId === career.id)}
                  key={career.id}
                  onClick={() =>
                    onSelect({ ...state, allCareers: false, careerId: career.id, year: null })
                  }
                  type="button"
                >
                  {career.name}
                </button>
              ))}
            </ChipRow>
          )}
          {careers.length > 0 ? (
            <ChipRow label="Año">
              <button
                className={chipClassName(state.year === null)}
                onClick={() => onSelect({ ...state, year: null })}
                type="button"
              >
                Todos
              </button>
              {Array.from({ length: maxYear }, (_, index) => index + 1).map((year) => (
                <button
                  aria-pressed={state.year === year}
                  className={chipClassName(state.year === year)}
                  key={year}
                  onClick={() => onSelect({ ...state, year })}
                  type="button"
                >
                  {year}°
                </button>
              ))}
            </ChipRow>
          ) : null}
        </div>
      ) : null}

      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Tipo de experiencia"
      >
        {typeSegments.map((segment) => (
          <button
            aria-pressed={state.kind === segment.kind}
            className={chipClassName(state.kind === segment.kind)}
            key={segment.label}
            onClick={() => onSelect({ ...state, kind: segment.kind })}
            type="button"
          >
            {segment.label}
          </button>
        ))}
      </div>

      {selectorOpen ? (
        <div className="relative">
          <UbicacionPanel
            current={ubicacion}
            onClose={() => setSelectorOpen(false)}
            onSave={(next) => {
              // The landing clears a stale carrera/año when it sees the new facultad.
              choose(next);
              setSelectorOpen(false);
            }}
            titleId={titleId}
          />
        </div>
      ) : null}
    </section>
  );
}
