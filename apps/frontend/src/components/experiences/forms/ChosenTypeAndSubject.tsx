import Link from 'next/link';
import { CalendarDays, GraduationCap } from 'lucide-react';

const KINDS = {
  exam: {
    Icon: GraduationCap,
    chooserType: 'final',
    copy: 'Una mesa concreta: formato, qué tomaron, cómo te fue.',
    label: 'Experiencia de final',
  },
  review: {
    Icon: CalendarDays,
    chooserType: 'resenar',
    copy: 'Cómo fue cursarla: clases, parciales, cómo terminaste.',
    label: 'Reseña de cursada',
  },
} as const;

/** «Cambiar» target: the chooser with this form's type and materia preselected. */
export function changeExperienceHref(kind: keyof typeof KINDS, subjectCode: string) {
  const params = new URLSearchParams({
    tipo: KINDS[kind].chooserType,
    materia: subjectCode,
    desde: 'formulario',
  });
  return `/experiencias/escribir?${params.toString()}`;
}

/**
 * Body of «¿Qué querés contar?»: the chosen type and materia, with «Cambiar»
 * back to `/experiencias/escribir` (hidden while editing an entry).
 */
export function ChosenTypeAndSubject({
  canChange,
  kind,
  onBeforeChange,
  subjectCode,
  subjectName,
}: {
  canChange: boolean;
  kind: keyof typeof KINDS;
  /** Runs before «Cambiar» navigates, so the form can keep what was typed. */
  onBeforeChange?: () => void;
  subjectCode: string;
  subjectName: string | null;
}) {
  const { Icon, copy, label } = KINDS[kind];
  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-3 rounded-xl border-2 border-foreground bg-secondary px-4 py-3.5">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={2} />
        <div className="min-w-0">
          <p className="font-sans text-[0.9375rem] font-extrabold text-card-foreground">{label}</p>
          <p className="mt-0.5 font-sans text-[0.8125rem] font-medium leading-snug text-secondary-foreground">
            {copy}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-muted px-3.5 py-2.5">
        <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.68rem] font-extrabold tracking-[0.06em] text-primary">
          {subjectCode}
        </span>
        {subjectName ? (
          <span className="min-w-0 font-sans text-[0.9rem] font-extrabold text-card-foreground">
            {subjectName}
          </span>
        ) : null}
        {canChange ? (
          <Link
            className="ml-auto inline-flex min-h-11 items-center font-sans text-[0.8125rem] font-bold text-link underline-offset-4 hover:underline"
            href={changeExperienceHref(kind, subjectCode)}
            onClick={onBeforeChange}
          >
            Cambiar
          </Link>
        ) : null}
      </div>
    </div>
  );
}
