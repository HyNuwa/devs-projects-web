'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { HowToRead } from '@/components/experiences/HowToRead';
import { LandingContext } from '@/components/experiences/LandingContext';
import { MostCommentedSubjects } from '@/components/experiences/MostCommentedSubjects';
import { RecentExperiences } from '@/components/experiences/RecentExperiences';
import { SubjectSearch } from '@/components/experiences/SubjectSearch';
import { YourTurn } from '@/components/experiences/YourTurn';
import { Button, ErrorState, LoadingState } from '@/components/ui/shadcn';
import { browsePath, getFacultyBrowse, type FacultyPage } from '@/lib/catalog-client';
import { getExperiencesOverview, type ExperiencesOverview } from '@/lib/experiences-client';
import {
  parseExperiencesLandingState,
  toExperiencesLandingHref,
  type ExperiencesLandingState,
} from '@/lib/experiences-landing-state';
import { firstCareerCursando } from '@/lib/study-plans-client';
import { useAuthStore } from '@/stores/authStore';
import { useUbicacionStore } from '@/stores/ubicacionStore';

type BrowseResult = { status: 'ready'; page: FacultyPage } | { status: 'unavailable' };

type OverviewResult =
  | { status: 'ready'; overview: ExperiencesOverview; query: string }
  | { status: 'error'; query: string };

/**
 * The experiencias landing (openspec academic-community/experiences): hero
 * with materia search, the Ubicación context with carrera/año/type chips,
 * «Materias más comentadas», «Tu turno», «Cómo leer» and «Recién publicadas».
 */
function LandingContent({ state }: { state: ExperiencesLandingState }) {
  const router = useRouter();
  const user = useAuthStore((store) => store.user);
  const authLoading = useAuthStore((store) => store.isLoading);
  const ubicacion = useUbicacionStore((store) => store.ubicacion);
  const ready = useUbicacionStore((store) => store.ready);
  const myCareers = useUbicacionStore((store) => store.myCareers);
  const load = useUbicacionStore((store) => store.load);

  const [browse, setBrowse] = useState<BrowseResult | null>(null);
  const [browseRetry, setBrowseRetry] = useState(0);
  const [result, setResult] = useState<OverviewResult | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [expandedContext, setExpandedContext] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (!authLoading) void load(Boolean(user));
  }, [authLoading, load, user]);

  // The signed-in student's first carrera cursando counts as preselected only
  // inside its own facultad and when the URL did not pick another one.
  const profileCareer = user ? firstCareerCursando(myCareers) : null;
  // Once the faculty browse is known, a URL carrera that is not among its
  // published careers behaves as an explicit «Todas» — it must not silently
  // fall back to the profile preselection, and without an Ubicación the URL
  // carrera/año never apply at all.
  const freshBrowse =
    browse?.status === 'ready' && browse.page.faculty.id === ubicacion?.facultyId
      ? browse.page
      : null;
  const careers = freshBrowse?.careers ?? [];
  const urlCareer = state.careerId
    ? careers.find((career) => career.id === state.careerId)
    : undefined;
  // Keep shared-link context until the matching browse can validate it.
  const careerOutOfScope = Boolean(freshBrowse && state.careerId && !urlCareer);
  // The profile preselection also needs the fresh browse to publish it — an
  // unpublishable profile carrera can never become a hidden filter.
  const profileCareerId =
    !state.careerId &&
    !state.allCareers &&
    ubicacion &&
    profileCareer?.faculty.id === ubicacion.facultyId &&
    careers.some((career) => career.id === profileCareer.career.id)
      ? profileCareer.career.id
      : null;
  const effectiveCareerId = ubicacion
    ? state.careerId
      ? careerOutOfScope
        ? null
        : state.careerId
      : profileCareerId
    : null;
  // The año cap comes from the effective selected carrera — explicit or
  // profile — and falls back to the faculty maximum when «Todas» is active.
  // Optativa-only careers (years: null) allow no año at all.
  const effectiveCareer =
    urlCareer ??
    (profileCareerId ? careers.find((career) => career.id === profileCareerId) : undefined);
  const effectiveMaxYear = effectiveCareer
    ? (effectiveCareer.years ?? 0)
    : careers.reduce((max, career) => Math.max(max, career.years ?? 0), 0);
  const effectiveYear =
    ubicacion && state.year && (!freshBrowse || state.year <= effectiveMaxYear) ? state.year : null;
  const effectiveState: ExperiencesLandingState = {
    ...state,
    allCareers: state.allCareers || careerOutOfScope,
    careerId: effectiveCareerId,
    year: effectiveYear,
  };

  // A facultad change made anywhere (the header or this page's «Cambiar»)
  // clears the stale carrera/año while keeping the type and an explicit
  // «Todas». This page is the only owner of that write; the first hydrated
  // location is not a transition and never writes to the URL.
  const previousFacultyId = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const facultyId = ubicacion?.facultyId ?? null;
    const previous = previousFacultyId.current;
    previousFacultyId.current = facultyId;
    if (previous === null || previous === facultyId) return;
    if (state.careerId || state.year) {
      router.push(toExperiencesLandingHref({ ...state, careerId: null, year: null }));
    }
  }, [ready, ubicacion, state, router]);

  useEffect(() => {
    if (!ready || !ubicacion) return;
    let current = true;
    void getFacultyBrowse(ubicacion.universityShortName, ubicacion.facultyShortName)
      .then((page) => {
        if (current) {
          setBrowse(page ? { page, status: 'ready' } : { status: 'unavailable' });
        }
      })
      .catch(() => {
        if (current) setBrowse({ status: 'unavailable' });
      });
    return () => {
      current = false;
    };
  }, [ready, ubicacion, browseRetry]);

  const overviewKind =
    state.kind === 'resenas' ? 'reviews' : state.kind === 'finales' ? 'exams' : undefined;
  // Results carry the query they answered, so a stale response never shows.
  const contextKey = JSON.stringify({
    careerId: ubicacion ? effectiveCareerId : null,
    facultyId: ubicacion?.facultyId ?? null,
    kind: overviewKind ?? null,
    year: ubicacion ? effectiveYear : null,
  });
  // Expanding applies to this context only; changing a chip restores its scope.
  const allFaculties = expandedContext === contextKey;
  const scopedFacultyId = allFaculties ? undefined : ubicacion?.facultyId;
  const queryKey = allFaculties ? JSON.stringify({ kind: overviewKind ?? null }) : contextKey;

  useEffect(() => {
    if (!ready) return;
    let current = true;
    void getExperiencesOverview({
      // Global requests keep only the type filter.
      ...(scopedFacultyId ? { facultyId: scopedFacultyId } : {}),
      ...(scopedFacultyId && effectiveCareerId ? { careerId: effectiveCareerId } : {}),
      ...(scopedFacultyId && effectiveYear ? { year: effectiveYear } : {}),
      ...(overviewKind ? { kind: overviewKind } : {}),
    })
      .then((overview) => {
        if (current) setResult({ overview, query: queryKey, status: 'ready' });
      })
      .catch(() => {
        if (current) setResult({ query: queryKey, status: 'error' });
      });
    return () => {
      current = false;
    };
  }, [ready, scopedFacultyId, effectiveCareerId, effectiveYear, overviewKind, retryKey, queryKey]);

  const current = result && result.query === queryKey ? result : null;
  const requestStatus = !ready || !current ? 'loading' : current.status;
  const overview = current?.status === 'ready' ? current.overview : null;

  const facultyLabel = scopedFacultyId
    ? (freshBrowse?.faculty.name ?? ubicacion?.facultyShortName ?? null)
    : null;
  const selectedCareer = scopedFacultyId
    ? careers.find((career) => career.id === effectiveCareerId)
    : undefined;
  const contextLabel = selectedCareer ? selectedCareer.name : 'todas las carreras';
  const seeAllHref =
    scopedFacultyId && freshBrowse
      ? selectedCareer
        ? browsePath.career(
            freshBrowse.university.shortName,
            freshBrowse.faculty.shortName,
            selectedCareer.slug,
          )
        : browsePath.faculty(freshBrowse.university.shortName, freshBrowse.faculty.shortName)
      : null;

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] pb-16">
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-[1180px] gap-8 px-3 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10">
          <div className="min-w-0">
            <p className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-primary">
              Experiencias · Comunidad
              {ubicacion ? ` ${ubicacion.facultyShortName}` : ''}
            </p>
            <h1 className="mt-4 font-sans text-[clamp(2.9rem,6vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.055em] text-foreground">
              Cómo les fue
              <br />
              <span className="text-primary">a los que ya cursaron</span>
              <span className="text-[#FA6304]">.</span>
            </h1>
            <p className="mt-5 max-w-[35rem] font-sans text-[1.0625rem] leading-relaxed text-secondary-foreground">
              Reseñas de cursada y experiencias de final escritas por estudiantes. Buscá tu materia
              y mirá cómo les fue a otros en tu mismo contexto.
            </p>
            <div className="mt-7 max-w-[41.25rem]">
              <SubjectSearch
                facultyId={ubicacion?.facultyId}
                facultyLabel={ubicacion?.facultyShortName}
              />
            </div>
          </div>
          <div className="relative hidden min-h-[15rem] lg:block" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- canvas illustration */}
            <img
              alt=""
              className="absolute right-0 top-0 w-[21rem]"
              src="/assets/hero-experiencias.png"
            />
            <span className="absolute left-0 top-7 w-32 rotate-[-5deg] text-center font-hand text-xl leading-[1.05] text-foreground">
              lo que nadie te cuenta, te lo cuentan acá ♥
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-3 sm:px-6">
        <div className="mt-8">
          <LandingContext
            browseFailed={browse?.status === 'unavailable'}
            careers={careers}
            onRetryBrowse={() => setBrowseRetry((value) => value + 1)}
            onSelect={(next) => router.push(toExperiencesLandingHref(next))}
            profileCareerId={profileCareerId}
            state={effectiveState}
            ubicacion={ubicacion}
          />
        </div>

        <div className="mt-9 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20.625rem]">
          <div className="min-w-0">
            {requestStatus === 'loading' ? (
              <LoadingState description="Estamos reuniendo las experiencias de tu contexto." />
            ) : !overview ? (
              <ErrorState
                action={
                  <Button onClick={() => setRetryKey((value) => value + 1)} variant="outline">
                    Reintentar
                  </Button>
                }
                description="No pudimos cargar las experiencias. Intentá de nuevo."
                heading="No pudimos cargar las experiencias"
              />
            ) : (
              <MostCommentedSubjects
                careerId={scopedFacultyId ? effectiveCareerId : null}
                contextLabel={contextLabel}
                facultyLabel={facultyLabel}
                mostCommented={overview.mostCommented}
                now={now}
                overviewKind={overview.scope.kind}
                seeAllHref={seeAllHref}
              />
            )}
          </div>
          <div className="grid gap-4">
            <YourTurn />
            <HowToRead />
          </div>
        </div>
        {overview ? (
          <div className="mt-10">
            <RecentExperiences
              facultyLabel={facultyLabel}
              now={now}
              onShowAllFaculties={() => setExpandedContext(contextKey)}
              overviewKind={overview.scope.kind}
              recent={overview.recent}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ExperiencesLanding() {
  const searchParams = useSearchParams();
  const rawSearch = searchParams.toString();
  const state = useMemo(
    () => parseExperiencesLandingState(new URLSearchParams(rawSearch)),
    [rawSearch],
  );

  return <LandingContent state={state} />;
}
