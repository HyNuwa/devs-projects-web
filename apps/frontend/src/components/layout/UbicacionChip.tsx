'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/shadcn/button';
import { browsePath } from '@/lib/catalog-client';
import { getInstitutions, type InstitutionTree } from '@/lib/study-plans-client';
import { useAuthStore } from '@/stores/authStore';
import { useUbicacionStore } from '@/stores/ubicacionStore';

const selectClassName =
  'min-h-11 w-full rounded-xl border-[1.5px] border-foreground bg-background px-3 font-sans text-sm font-semibold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * The header's ubicación (openspec academic-structure/browsing): the facultad
 * of the student's carrera, or one chosen on this device. It links to that
 * facultad and lets anyone choose another; it never filters content.
 */
export function UbicacionChip() {
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const ubicacion = useUbicacionStore((state) => state.ubicacion);
  const ready = useUbicacionStore((state) => state.ready);
  const load = useUbicacionStore((state) => state.load);
  const choose = useUbicacionStore((state) => state.choose);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!authLoading) void load(Boolean(user));
  }, [authLoading, load, user]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  if (!ready) {
    // Same footprint as the chip, so the header does not shift when it resolves.
    return <span aria-hidden="true" className="inline-block h-11 w-14 lg:w-28" />;
  }

  const label = ubicacion
    ? `Tu ubicación: ${ubicacion.universityShortName} · ${ubicacion.facultyShortName}`
    : 'Elegí tu facultad';

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-label={label}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[1.5px] border-foreground bg-card px-2.5 text-xs font-extrabold tracking-[0.08em] text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setOpen((value) => !value)}
        ref={buttonRef}
        type="button"
      >
        <MapPin aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.1} />
        {ubicacion ? (
          <>
            <span className="lg:hidden">{ubicacion.facultyShortName}</span>
            <span className="hidden lg:inline">
              {ubicacion.universityShortName} · {ubicacion.facultyShortName}
            </span>
          </>
        ) : (
          <span>Elegí</span>
        )}
      </button>
      {open ? (
        <UbicacionPanel
          current={ubicacion}
          onClose={close}
          onSave={(next) => {
            choose(next);
            close();
          }}
          titleId={titleId}
        />
      ) : null}
    </div>
  );
}

function UbicacionPanel({
  current,
  onClose,
  onSave,
  titleId,
}: {
  current: ReturnType<typeof useUbicacionStore.getState>['ubicacion'];
  onClose: () => void;
  onSave: (next: NonNullable<ReturnType<typeof useUbicacionStore.getState>['ubicacion']>) => void;
  titleId: string;
}) {
  const [tree, setTree] = useState<InstitutionTree | null>(null);
  const [failed, setFailed] = useState(false);
  const [universityId, setUniversityId] = useState(current?.universityId ?? '');
  const [facultyId, setFacultyId] = useState(current?.facultyId ?? '');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getInstitutions()
      .then((institutions) => {
        if (active) setTree(institutions);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    panelRef.current?.focus();
    return () => {
      active = false;
    };
  }, []);

  const university = tree?.find((entry) => entry.id === universityId);
  const faculty = university?.faculties.find((entry) => entry.id === facultyId);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      aria-labelledby={titleId}
      className="fixed inset-x-4 top-16 z-40 grid gap-3 lg:absolute lg:inset-x-auto lg:right-0 lg:top-[calc(100%+0.5rem)] lg:w-80 rounded-2xl border-[1.5px] border-foreground bg-card p-4 font-sans shadow-pop outline-none"
      onKeyDown={onKeyDown}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <h2 className="text-base font-extrabold" id={titleId}>
        Tu ubicación
      </h2>
      <p className="text-xs font-semibold text-muted-foreground">
        Define dónde empiezan la búsqueda y los rankings. No oculta nada.
      </p>
      {current ? (
        <Link
          className="text-sm font-bold text-link underline-offset-4 hover:underline"
          href={browsePath.faculty(current.universityShortName, current.facultyShortName)}
          onClick={onClose}
        >
          Ir a {current.facultyShortName} · {current.universityShortName} →
        </Link>
      ) : null}
      {failed ? (
        <p className="text-xs font-semibold text-muted-foreground">
          No pudimos cargar las facultades para elegir otra.
        </p>
      ) : tree ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!university || !faculty) return;
            onSave({
              universityId: university.id,
              universityShortName: university.shortName,
              facultyId: faculty.id,
              facultyShortName: faculty.shortName,
            });
          }}
        >
          <label className="grid gap-1.5 text-sm font-bold">
            Universidad
            <select
              className={selectClassName}
              onChange={(event) => {
                setUniversityId(event.target.value);
                setFacultyId('');
              }}
              value={universityId}
            >
              <option value="">Elegí una</option>
              {tree.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.shortName} · {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Facultad
            <select
              className={selectClassName}
              disabled={!university}
              onChange={(event) => setFacultyId(event.target.value)}
              value={facultyId}
            >
              <option value="">Elegí una</option>
              {university?.faculties.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <Button disabled={!faculty} type="submit">
            Guardar
          </Button>
        </form>
      ) : (
        <p className="text-xs font-semibold text-muted-foreground">Cargando facultades…</p>
      )}
    </div>
  );
}
