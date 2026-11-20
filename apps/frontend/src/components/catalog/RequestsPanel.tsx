'use client';

import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';

import { ModerationHeader } from '@/components/moderation/ModerationHeader';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  FieldError,
  FieldLabel,
  Input,
  LoadingState,
} from '@/components/ui/shadcn';
import {
  catalogAdmin,
  type AdminCareer,
  type AdminCareerRequest,
  type AdminFaculty,
  type AdminUniversity,
} from '@/lib/catalog-admin-client';
import { useAuthStore } from '@/stores/authStore';

import { CatalogNav } from './CatalogPanel';
import { errorMessage, SLUG_HINT } from './CatalogForms';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN']);
const SLUG = /^[A-Za-z0-9-]+$/;
const selectClass =
  'min-h-11 rounded-md border-[1.5px] border-input bg-card px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring';
const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

/** Solicitudes de carrera waiting for an admin (openspec academic-structure/career-requests). */
export function RequestsPanel() {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = Boolean(role && ADMIN_ROLES.has(role));
  const [requests, setRequests] = useState<AdminCareerRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await catalogAdmin.requests());
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    catalogAdmin
      .requests()
      .then(setRequests)
      .catch((caught: unknown) => setError(errorMessage(caught)));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <EmptyState
        description="Si creés que deberías tener acceso, hablá con un admin."
        heading="Esta sección es solo para admins."
      />
    );
  }

  return (
    <div className="grid gap-6 font-sans">
      <ModerationHeader
        active="catalogo"
        description="Las carreras que piden los estudiantes, con el link a su plan. Aceptar crea la carrera en borrador."
        requestCount={requests?.length}
      />
      <CatalogNav active="solicitudes" pending={requests?.length} />
      {error ? (
        <ErrorState description={error} heading="No pudimos cargar las solicitudes" />
      ) : null}
      {!requests && !error ? <LoadingState heading="Cargando solicitudes" /> : null}
      {requests?.length === 0 ? (
        <EmptyState
          description="Cuando alguien pida su carrera, aparece acá."
          heading="No hay solicitudes pendientes."
        />
      ) : null}
      {requests && requests.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <RequestCard key={request.id} onResolved={load} request={request} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type Mode = null | 'accept' | 'reject' | 'loaded';

function RequestCard({
  onResolved,
  request,
}: {
  onResolved: () => Promise<void>;
  request: AdminCareerRequest;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const faculty = request.faculty
    ? `${request.faculty.shortName} · ${request.faculty.university.shortName}`
    : `${[request.facultyText, request.universityText].filter(Boolean).join(' · ')} (no está en el catálogo)`;

  return (
    <article className="grid gap-3 rounded-2xl border-[1.5px] border-foreground bg-card p-5 shadow-pop">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-extrabold tracking-[-0.03em]">{request.careerName}</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-link">
          {request.count === 1 ? '1 estudiante' : `${request.count} estudiantes`}
        </span>
      </div>
      <p className="text-sm font-semibold">{faculty}</p>
      <p className="text-sm text-muted-foreground">
        Pidió @{request.author} · {dateFormat.format(new Date(request.createdAt))}
      </p>
      {request.comment ? <p className="text-sm">«{request.comment}»</p> : null}
      <a
        className="text-sm font-bold text-link underline-offset-4 hover:underline"
        href={request.planUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Plan oficial ↗<span className="sr-only"> (se abre en otra pestaña)</span>
      </a>

      {mode === null ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setMode('accept')} size="sm" type="button">
            Aceptar
          </Button>
          <Button onClick={() => setMode('loaded')} size="sm" type="button" variant="outline">
            Ya está cargada
          </Button>
          <Button onClick={() => setMode('reject')} size="sm" type="button" variant="ghost">
            Rechazar
          </Button>
        </div>
      ) : null}
      {mode === 'accept' ? (
        <AcceptForm onCancel={() => setMode(null)} onDone={onResolved} request={request} />
      ) : null}
      {mode === 'reject' ? (
        <RejectForm onCancel={() => setMode(null)} onDone={onResolved} request={request} />
      ) : null}
      {mode === 'loaded' ? (
        <LoadedForm onCancel={() => setMode(null)} onDone={onResolved} request={request} />
      ) : null}
    </article>
  );
}

type FormProps = {
  onCancel: () => void;
  onDone: () => Promise<void>;
  request: AdminCareerRequest;
};

function Actions({ label, onCancel }: { label: string; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" type="submit">
        {label}
      </Button>
      <Button onClick={onCancel} size="sm" type="button" variant="ghost">
        Cancelar
      </Button>
    </div>
  );
}

function AcceptForm({ onCancel, onDone, request }: FormProps) {
  const id = useId();
  const needsFaculty = !request.faculty;
  const [name, setName] = useState(request.careerName);
  const [code, setCode] = useState('');
  const [facultyName, setFacultyName] = useState(request.facultyText ?? '');
  const [facultyShort, setFacultyShort] = useState('');
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [universityName, setUniversityName] = useState(request.universityText ?? '');
  const [universityShort, setUniversityShort] = useState('');
  /** An existing facultad of the chosen universidad, or '' for a new one. */
  const [existingFaculty, setExistingFaculty] = useState('');
  const [faculties, setFaculties] = useState<AdminFaculty[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!universityId || universityId === '__new') return;
    let active = true;
    catalogAdmin
      .faculties(universityId)
      .then((list) => {
        if (active) setFaculties(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [universityId]);

  useEffect(() => {
    if (needsFaculty)
      void catalogAdmin
        .universities()
        .then(setUniversities)
        .catch(() => undefined);
  }, [needsFaculty]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !SLUG.test(code.trim())) {
      return setError(`Completá el nombre y el código de la carrera. Código: ${SLUG_HINT}`);
    }
    let faculty;
    if (needsFaculty && existingFaculty) {
      setError(null);
      try {
        await catalogAdmin.acceptRequest(request.id, {
          facultyId: existingFaculty,
          career: { name: name.trim(), code: code.trim() },
        });
        await onDone();
      } catch (caught) {
        setError(errorMessage(caught));
      }
      return;
    }
    if (needsFaculty) {
      if (!facultyName.trim() || !SLUG.test(facultyShort.trim())) {
        return setError(`Completá la facultad. Nombre corto: ${SLUG_HINT}`);
      }
      if (
        universityId === '__new' &&
        (!universityName.trim() || !SLUG.test(universityShort.trim()))
      ) {
        return setError(`Completá la universidad nueva. Nombre corto: ${SLUG_HINT}`);
      }
      if (!universityId) return setError('Elegí la universidad.');
      faculty = {
        name: facultyName.trim(),
        shortName: facultyShort.trim(),
        ...(universityId === '__new'
          ? { university: { name: universityName.trim(), shortName: universityShort.trim() } }
          : { universityId }),
      };
    }
    setError(null);
    try {
      await catalogAdmin.acceptRequest(request.id, {
        career: { name: name.trim(), code: code.trim() },
        ...(faculty ? { faculty } : {}),
      });
      await onDone();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <form className="grid gap-3 border-t border-line pt-3" onSubmit={submit}>
      {needsFaculty ? (
        <>
          <Field>
            <FieldLabel htmlFor={`${id}-uni`}>Universidad</FieldLabel>
            <select
              className={selectClass}
              id={`${id}-uni`}
              onChange={(event) => {
                setUniversityId(event.target.value);
                setExistingFaculty('');
                setFaculties([]);
              }}
              value={universityId}
            >
              <option value="">Elegí la universidad</option>
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.shortName} · {university.name}
                </option>
              ))}
              <option value="__new">Universidad nueva…</option>
            </select>
          </Field>
          {universityId === '__new' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${id}-uni-name`}>Nombre de la universidad</FieldLabel>
                <Input
                  id={`${id}-uni-name`}
                  onChange={(e) => setUniversityName(e.target.value)}
                  value={universityName}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-uni-short`}>Nombre corto de la universidad</FieldLabel>
                <Input
                  id={`${id}-uni-short`}
                  onChange={(e) => setUniversityShort(e.target.value)}
                  value={universityShort}
                />
              </Field>
            </div>
          ) : null}
          {universityId && universityId !== '__new' ? (
            <Field>
              <FieldLabel htmlFor={`${id}-fac`}>Facultad</FieldLabel>
              <select
                className={selectClass}
                id={`${id}-fac`}
                onChange={(event) => setExistingFaculty(event.target.value)}
                value={existingFaculty}
              >
                <option value="">Facultad nueva…</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.shortName} · {faculty.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {existingFaculty ? null : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${id}-fac-name`}>Nombre de la facultad</FieldLabel>
                <Input
                  id={`${id}-fac-name`}
                  onChange={(e) => setFacultyName(e.target.value)}
                  value={facultyName}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-fac-short`}>Nombre corto de la facultad</FieldLabel>
                <Input
                  id={`${id}-fac-short`}
                  onChange={(e) => setFacultyShort(e.target.value)}
                  value={facultyShort}
                />
              </Field>
            </div>
          )}
        </>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${id}-name`}>Nombre de la carrera</FieldLabel>
          <Input id={`${id}-name`} onChange={(e) => setName(e.target.value)} value={name} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-code`}>Código</FieldLabel>
          <Input
            id={`${id}-code`}
            onChange={(e) => setCode(e.target.value)}
            placeholder="LF"
            value={code}
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        La carrera queda en borrador con el link al plan; la publicás desde el árbol cuando tenga
        sus materias.
      </p>
      <FieldError>{error}</FieldError>
      <Actions label="Crear borrador" onCancel={onCancel} />
    </form>
  );
}

function RejectForm({ onCancel, onDone, request }: FormProps) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) return setError('Escribí el motivo: lo ven quienes la pidieron.');
    setError(null);
    try {
      await catalogAdmin.rejectRequest(request.id, reason.trim());
      await onDone();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };
  return (
    <form className="grid gap-3 border-t border-line pt-3" onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor={`${id}-reason`}>Motivo</FieldLabel>
        <textarea
          className="min-h-24 rounded-md border-[1.5px] border-input bg-card p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          id={`${id}-reason`}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          value={reason}
        />
      </Field>
      <FieldError>{error}</FieldError>
      <Actions label="Confirmar rechazo" onCancel={onCancel} />
    </form>
  );
}

/** Picks a published carrera: of the solicitud's facultad, or walking universidad → facultad. */
function LoadedForm({ onCancel, onDone, request }: FormProps) {
  const id = useId();
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [faculties, setFaculties] = useState<AdminFaculty[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [facultyId, setFacultyId] = useState(request.faculty?.id ?? '');
  const [careers, setCareers] = useState<AdminCareer[]>([]);
  const [careerId, setCareerId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request.faculty)
      void catalogAdmin
        .universities()
        .then(setUniversities)
        .catch(() => undefined);
  }, [request.faculty]);
  useEffect(() => {
    if (universityId)
      void catalogAdmin
        .faculties(universityId)
        .then(setFaculties)
        .catch(() => undefined);
  }, [universityId]);
  useEffect(() => {
    if (!facultyId) return;
    void catalogAdmin
      .careers(facultyId)
      .then((list) => setCareers(list.filter((career) => career.status === 'PUBLISHED')))
      .catch(() => undefined);
  }, [facultyId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!careerId) return setError('Elegí la carrera.');
    setError(null);
    try {
      await catalogAdmin.alreadyLoaded(request.id, careerId);
      await onDone();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <form className="grid gap-3 border-t border-line pt-3" onSubmit={submit}>
      {!request.faculty ? (
        <>
          <Field>
            <FieldLabel htmlFor={`${id}-uni`}>Universidad</FieldLabel>
            <select
              className={selectClass}
              id={`${id}-uni`}
              onChange={(e) => {
                setUniversityId(e.target.value);
                setFacultyId('');
                setCareers([]);
                setCareerId('');
              }}
              value={universityId}
            >
              <option value="">Elegí la universidad</option>
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.shortName} · {university.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-fac`}>Facultad</FieldLabel>
            <select
              className={selectClass}
              id={`${id}-fac`}
              onChange={(e) => {
                setFacultyId(e.target.value);
                setCareers([]);
                setCareerId('');
              }}
              value={facultyId}
            >
              <option value="">Elegí la facultad</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.shortName} · {faculty.name}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : null}
      <Field>
        <FieldLabel htmlFor={`${id}-career`}>Carrera</FieldLabel>
        <select
          className={selectClass}
          id={`${id}-career`}
          onChange={(e) => setCareerId(e.target.value)}
          value={careerId}
        >
          <option value="">Elegí la carrera publicada</option>
          {careers.map((career) => (
            <option key={career.id} value={career.id}>
              {career.name}
            </option>
          ))}
        </select>
      </Field>
      <FieldError>{error}</FieldError>
      <Actions label="Confirmar" onCancel={onCancel} />
    </form>
  );
}
