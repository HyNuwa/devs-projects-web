'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, type FormEvent } from 'react';

import { Button, Field, FieldError, FieldLabel, Input, LoadingState } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import { loginHrefForReturnPath } from '@/lib/auth-return-path';
import {
  askForCareer,
  getPendingRequests,
  supportRequest,
  type PendingRequest,
} from '@/lib/career-requests-client';
import { getInstitutions, type InstitutionTree } from '@/lib/study-plans-client';
import { useAuthStore } from '@/stores/authStore';

const MISSING = '__missing';
const selectClass =
  'min-h-11 rounded-md border-[1.5px] border-input bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring';

/**
 * «Pedí tu carrera» (openspec academic-structure/career-requests): a carrera
 * of a catálogo facultad, or of one written in free text, with its plan link.
 */
export function CareerRequestForm({ facultyId: initialFaculty }: { facultyId?: string }) {
  const id = useId();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [tree, setTree] = useState<InstitutionTree | null>(null);
  const [universityId, setUniversityId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [universityText, setUniversityText] = useState('');
  const [facultyText, setFacultyText] = useState('');
  const [careerName, setCareerName] = useState('');
  const [planUrl, setPlanUrl] = useState('');
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isLoading || user) return;
    const back = `/universidades/pedir${initialFaculty ? `?facultad=${initialFaculty}` : ''}`;
    router.replace(loginHrefForReturnPath(back));
  }, [initialFaculty, isLoading, router, user]);

  useEffect(() => {
    if (!user) return;
    getInstitutions()
      .then((data) => {
        setTree(data);
        const university = data.find((u) => u.faculties.some((f) => f.id === initialFaculty));
        if (university && initialFaculty) {
          setUniversityId(university.id);
          setFacultyId(initialFaculty);
        }
      })
      .catch((caught: unknown) => setError(getApiError(caught)));
  }, [initialFaculty, user]);

  const inCatalog = Boolean(facultyId) && facultyId !== MISSING;
  useEffect(() => {
    if (!inCatalog) return;
    let active = true;
    getPendingRequests(facultyId)
      .then((list) => {
        if (active) setPending(list);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [facultyId, inCatalog]);

  if (!user) return <LoadingState heading="Te llevamos a ingresar" />;
  if (!tree && !error) return <LoadingState heading="Cargando universidades" />;

  const university = tree?.find((u) => u.id === universityId);
  const universityMissing = universityId === MISSING;
  const facultyMissing = universityMissing || facultyId === MISSING;

  const join = async (requestId: string) => {
    try {
      await supportRequest(requestId);
      setPending((list) =>
        list.map((r) => (r.id === requestId ? { ...r, supported: true, count: r.count + 1 } : r)),
      );
    } catch (caught) {
      setError(getApiError(caught));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!universityId) return setError('Elegí tu universidad.');
    if (universityMissing && !universityText.trim())
      return setError('Escribí el nombre de tu universidad.');
    if (!universityMissing && !facultyId) return setError('Elegí tu facultad.');
    if (facultyMissing && !facultyText.trim()) return setError('Escribí el nombre de tu facultad.');
    if (!careerName.trim()) return setError('Escribí el nombre de la carrera.');
    if (!/^https:\/\/\S+$/.test(planUrl.trim())) {
      return setError('El link al plan tiene que empezar con https://.');
    }
    setError(null);
    try {
      await askForCareer({
        ...(facultyMissing
          ? {
              ...(universityMissing
                ? { universityText: universityText.trim() }
                : { universityText: university?.name }),
              facultyText: facultyText.trim(),
            }
          : { facultyId }),
        careerName: careerName.trim(),
        planUrl: planUrl.trim(),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      setSent(true);
    } catch (caught) {
      setError(getApiError(caught));
    }
  };

  if (sent) {
    return (
      <div
        className="grid gap-3 rounded-2xl border-[1.5px] border-foreground bg-card p-6 shadow-pop"
        role="status"
      >
        <p className="text-lg font-extrabold">Listo: recibimos tu pedido.</p>
        <p className="text-sm text-muted-foreground">
          Te escribimos por email cuando carguemos la carrera o si no podemos sumarla. Mientras, lo
          seguís en Mis solicitudes.
        </p>
        <Link
          className="font-bold text-link underline-offset-4 hover:underline"
          href="/profile/me#mis-solicitudes"
        >
          Ver mis solicitudes
        </Link>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5 rounded-2xl border-[1.5px] border-foreground bg-card p-6 shadow-pop"
      onSubmit={submit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${id}-uni`}>Universidad</FieldLabel>
          <select
            className={selectClass}
            id={`${id}-uni`}
            onChange={(event) => {
              setUniversityId(event.target.value);
              setFacultyId('');
              setPending([]);
            }}
            value={universityId}
          >
            <option value="">Elegí tu universidad</option>
            {(tree ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
            <option value={MISSING}>No está en la lista</option>
          </select>
        </Field>
        {!universityMissing ? (
          <Field>
            <FieldLabel htmlFor={`${id}-fac`}>Facultad</FieldLabel>
            <select
              className={selectClass}
              disabled={!university}
              id={`${id}-fac`}
              onChange={(event) => {
                setFacultyId(event.target.value);
                setPending([]);
              }}
              value={facultyId}
            >
              <option value="">Elegí tu facultad</option>
              {(university?.faculties ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
              <option value={MISSING}>No está en la lista</option>
            </select>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor={`${id}-uni-text`}>Nombre de tu universidad</FieldLabel>
            <Input
              id={`${id}-uni-text`}
              maxLength={150}
              onChange={(e) => setUniversityText(e.target.value)}
              value={universityText}
            />
          </Field>
        )}
        {facultyMissing ? (
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor={`${id}-fac-text`}>Nombre de tu facultad</FieldLabel>
            <Input
              id={`${id}-fac-text`}
              maxLength={150}
              onChange={(e) => setFacultyText(e.target.value)}
              value={facultyText}
            />
          </Field>
        ) : null}
      </div>

      {pending.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-bold">
            ¿Es alguna de estas? Sumate en vez de pedirla de nuevo.
          </p>
          <ul aria-label="Ya pedidas en esta facultad" className="grid gap-2">
            {pending.map((request) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-line bg-background px-4 py-3 text-sm"
                key={request.id}
              >
                <span>
                  <strong>{request.careerName}</strong> ·{' '}
                  {request.count === 1 ? '1 estudiante' : `${request.count} estudiantes`}
                </span>
                {request.mine ? (
                  <span className="text-muted-foreground">Es tuya</span>
                ) : request.supported ? (
                  <span className="font-bold">Te sumaste</span>
                ) : (
                  <Button
                    onClick={() => void join(request.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Yo también
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Field>
        <FieldLabel htmlFor={`${id}-career`}>Carrera</FieldLabel>
        <Input
          id={`${id}-career`}
          maxLength={100}
          onChange={(e) => setCareerName(e.target.value)}
          value={careerName}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-plan`}>Link al plan de estudios oficial</FieldLabel>
        <Input
          id={`${id}-plan`}
          inputMode="url"
          maxLength={500}
          onChange={(e) => setPlanUrl(e.target.value)}
          placeholder="https://"
          value={planUrl}
        />
        <p className="text-xs text-muted-foreground">
          La página de tu universidad donde figuran las materias por año. Con eso la cargamos.
        </p>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-comment`}>Comentario (opcional)</FieldLabel>
        <textarea
          className="min-h-20 rounded-md border-[1.5px] border-input bg-card p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          id={`${id}-comment`}
          maxLength={500}
          onChange={(e) => setComment(e.target.value)}
          value={comment}
        />
      </Field>
      <FieldError>{error}</FieldError>
      <div>
        <Button type="submit" variant="pop">
          Pedir la carrera
        </Button>
      </div>
    </form>
  );
}
