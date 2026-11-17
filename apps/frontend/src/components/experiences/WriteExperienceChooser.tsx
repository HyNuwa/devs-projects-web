'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { SubjectSearch } from '@/components/experiences/SubjectSearch';
import { readExperienceDraft } from '@/components/experiences/forms/experience-draft';
import { Button } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import { useUbicacionStore } from '@/stores/ubicacionStore';

type ExperienceKind = 'resenar' | 'final';
type ChosenSubject = { code: string | null; name: string | null };

/** The draft slot is read once per render; nothing else writes it while the chooser is open. */
const subscribeToNothing = () => () => {};

const KINDS: ReadonlyArray<{ id: ExperienceKind; copy: string; label: string }> = [
  { id: 'resenar', copy: 'Contá cómo fue cursarla', label: 'Reseña de cursada' },
  { id: 'final', copy: 'Contá cómo fue rendirla', label: 'Experiencia de final' },
];

/**
 * The /experiencias/escribir bridge (openspec academic-community/experiences):
 * pick a materia and an experience type, then continue to the existing form.
 * No sign-in gate here — each form owns its own auth return path.
 */
export function WriteExperienceChooser() {
  const searchParams = useSearchParams();
  const fromForm = searchParams.get('desde') === 'formulario';
  const preselectedCode = searchParams.get('materia');
  const [kind, setKind] = useState<ExperienceKind | null>(() => {
    const tipo = searchParams.get('tipo');
    return KINDS.find((option) => option.id === tipo)?.id ?? null;
  });
  const [subject, setSubject] = useState<ChosenSubject | null>(() =>
    preselectedCode ? { code: preselectedCode, name: null } : null,
  );
  const facultyId = useUbicacionStore((store) => store.ubicacion?.facultyId);

  // Back from a form's «Cambiar»: name the materia the draft was typed for.
  const draftSubjectName = useSyncExternalStore(
    subscribeToNothing,
    () => {
      if (!fromForm || !preselectedCode) return null;
      const draft = readExperienceDraft();
      return draft?.subjectCode === preselectedCode ? draft.subjectName : null;
    },
    () => null,
  );
  const subjectName =
    subject?.name ?? (subject?.code === preselectedCode ? draftSubjectName : null);

  const encoded = subject?.code ? encodeURIComponent(subject.code) : null;
  // The form continued to reads the draft only when it comes from this round trip.
  const href =
    kind && encoded ? `/materias/${encoded}/${kind}${fromForm ? '?desde=formulario' : ''}` : null;

  return (
    <section className="mx-auto grid w-full max-w-[720px] gap-8 px-3 py-10 sm:px-6 sm:py-14">
      <header className="grid gap-3 text-center">
        <Image
          alt=""
          aria-hidden="true"
          className="mx-auto size-20"
          height={80}
          src="/assets/gato-escribe.png"
          width={80}
        />
        <h1 className="font-sans text-4xl font-extrabold leading-[0.96] text-foreground">
          Escribir experiencia
        </h1>
        <p className="mx-auto max-w-[46ch] font-sans text-base leading-relaxed text-muted-foreground">
          Elegí la materia y el tipo de experiencia.
        </p>
      </header>

      <fieldset className="grid gap-3">
        <legend className="mb-2 font-sans text-sm font-bold text-foreground">
          ¿Qué querés contar?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map((option) => (
            <label
              className={cn(
                'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-4 py-3 font-sans transition-colors',
                kind === option.id
                  ? 'border-primary bg-accent text-foreground'
                  : 'border-line bg-card text-muted-foreground hover:border-primary',
              )}
              key={option.id}
            >
              <input
                checked={kind === option.id}
                className="mt-1 accent-primary"
                name="experience-kind"
                onChange={() => setKind(option.id)}
                type="radio"
                value={option.id}
              />
              <span className="grid gap-0.5">
                <span className="text-sm font-extrabold">{option.label}</span>
                <span className="text-xs font-semibold">{option.copy}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <span className="font-sans text-sm font-bold text-foreground">¿En qué materia?</span>
        {subject ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-primary bg-card px-4 py-3">
            <p className="inline-flex min-w-0 max-w-full items-center gap-2 break-words font-sans text-sm font-bold text-foreground">
              <CheckCircle2 aria-hidden="true" className="size-4 text-primary" strokeWidth={2} />
              {subjectName ?? <span>{subject.code}</span>}
              {subject.code && subjectName ? (
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  ({subject.code})
                </span>
              ) : null}
            </p>
            <Button onClick={() => setSubject(null)} size="sm" variant="outline">
              Cambiar materia
            </Button>
          </div>
        ) : (
          <SubjectSearch
            facultyId={facultyId}
            onSelect={(choice) => setSubject({ code: choice.code, name: choice.name })}
          />
        )}
      </div>

      {href ? (
        <Button asChild size="lg">
          <Link href={href}>Continuar</Link>
        </Button>
      ) : (
        <Button disabled size="lg">
          Continuar
        </Button>
      )}
    </section>
  );
}
