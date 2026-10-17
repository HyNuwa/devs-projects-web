'use client';

import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';

import {
  Button,
  ErrorState,
  Field,
  FieldError,
  FieldLabel,
  Input,
  LoadingState,
} from '@/components/ui/shadcn';
import {
  catalogAdmin,
  catalogError,
  type AdminCareerDetail,
  type AdminSubject,
  type BulkPreviewRow,
  type BulkRow,
  type Placement,
  type PlacementBody,
  type PlanReading,
  type Semester,
} from '@/lib/catalog-admin-client';

import { errorMessage, SLUG_HINT } from './CatalogForms';

const YEARS = Array.from({ length: 10 }, (_, index) => index + 1);
const SEMESTERS: { value: Semester; label: string }[] = [
  { value: 1, label: '1.º cuatrimestre' },
  { value: 2, label: '2.º cuatrimestre' },
  { value: 0, label: 'Anual' },
];
/** The año select's value for an optativa. */
const OPTATIVA = 'O';
const SLUG = /^[A-Za-z0-9-]+$/;
const selectClass =
  'min-h-11 rounded-md border-[1.5px] border-input bg-card px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring';

/**
 * Placements by año; within it anuales first, then each cuatrimestre, then by
 * name. Optativas have no año and are left out.
 */
function byYear(placements: Placement[]) {
  const years = new Map<number, Placement[]>();
  for (const placement of placements) {
    if (placement.year === null) continue;
    years.set(placement.year, [...(years.get(placement.year) ?? []), placement]);
  }
  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(
      ([year, list]) =>
        [
          year,
          list.sort(
            (a, b) => (a.semester ?? 0) - (b.semester ?? 0) || a.name.localeCompare(b.name, 'es'),
          ),
        ] as const,
    );
}

/** The body for a placement: an optativa has neither año nor cuatrimestre. */
function placementBody(
  year: number | typeof OPTATIVA,
  semester: Semester,
  credits: number | null,
): PlacementBody {
  return year === OPTATIVA ? { optativa: true, credits } : { year, semester, credits };
}

/** The año select: 1.º to 10.º, then «Optativa». */
function YearOptions() {
  return (
    <>
      {YEARS.map((value) => (
        <option key={value} value={value}>
          {value}.º
        </option>
      ))}
      <option value={OPTATIVA}>Optativa</option>
    </>
  );
}

/** A carrera's materias by año, editable one by one or with the carga masiva. */
export function CareerEditor({ careerId }: { careerId: string }) {
  const [career, setCareer] = useState<AdminCareerDetail | null>(null);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const detail = await catalogAdmin.career(careerId);
      setCareer(detail);
      setSubjects(await catalogAdmin.subjects(detail.faculty.id));
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, [careerId]);

  useEffect(() => {
    let active = true;
    catalogAdmin
      .career(careerId)
      .then(async (detail) => {
        const list = await catalogAdmin.subjects(detail.faculty.id);
        if (!active) return;
        setCareer(detail);
        setSubjects(list);
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [careerId]);

  if (error) return <ErrorState description={error} heading="No pudimos cargar la carrera" />;
  if (!career) return <LoadingState heading="Cargando materias" />;

  const place = async (placement: Placement, change: Partial<Placement>) => {
    setRowError(null);
    try {
      const next = { ...placement, ...change };
      // An optativa moved to an año starts in the 1.º cuatrimestre.
      await catalogAdmin.setPlacement(
        careerId,
        placement.subjectId,
        placementBody(next.year ?? OPTATIVA, next.semester ?? 1, next.credits),
      );
      await load();
    } catch (caught) {
      setRowError(errorMessage(caught));
    }
  };

  const remove = async (placement: Placement) => {
    setRowError(null);
    try {
      await catalogAdmin.removePlacement(careerId, placement.subjectId);
      await load();
    } catch (caught) {
      setRowError(errorMessage(caught));
    }
  };

  const placed = new Set(career.placements.map((p) => p.subjectId));
  const optativas = career.placements
    .filter((p) => p.year === null)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return (
    <section
      aria-label={`Materias de ${career.name}`}
      className="grid gap-4 rounded-2xl border-[1.5px] border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-[-0.03em]">Materias</h2>
        <p className="text-sm text-muted-foreground">
          Quitar una materia de la carrera no la borra: sigue en la facultad con su contenido.
        </p>
      </div>
      <FieldError>{rowError}</FieldError>

      {career.placements.length === 0 ? (
        <p className="rounded-xl border-[1.5px] border-dashed border-line p-4 text-sm font-semibold text-muted-foreground">
          Todavía no tiene materias. Agregalas una por una o con la carga masiva.
        </p>
      ) : (
        byYear(career.placements).map(([year, list]) => (
          <section aria-labelledby={`editor-anio-${year}`} className="grid gap-2" key={year}>
            <h3 className="text-lg font-extrabold" id={`editor-anio-${year}`}>
              {year}.º año
            </h3>
            <PlacementTable list={list} onPlace={place} onRemove={remove} />
          </section>
        ))
      )}
      {optativas.length > 0 ? (
        <section aria-labelledby="editor-optativas" className="grid gap-2">
          <h3 className="text-lg font-extrabold" id="editor-optativas">
            Optativas
          </h3>
          <PlacementTable list={optativas} onPlace={place} onRemove={remove} />
        </section>
      ) : null}

      <AddPlacement
        careerId={careerId}
        facultyId={career.faculty.id}
        onAdded={load}
        subjects={subjects.filter((subject) => !placed.has(subject.id))}
      />
      <BulkLoad
        careerId={careerId}
        facultyId={career.faculty.id}
        onApplied={load}
        plan={career.status === 'DRAFT' ? career.planUrl : undefined}
      />
    </section>
  );
}

/** A group's materias, each with its año (or «Optativa») and cuatrimestre. */
function PlacementTable({
  list,
  onPlace,
  onRemove,
}: {
  list: Placement[];
  onPlace: (placement: Placement, change: Partial<Placement>) => Promise<void>;
  onRemove: (placement: Placement) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            <th className="p-2" scope="col">
              Materia
            </th>
            <th className="p-2" scope="col">
              Año
            </th>
            <th className="p-2" scope="col">
              Cuatrimestre
            </th>
            <th className="p-2" scope="col">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((placement) => (
            <tr className="border-t border-line" key={placement.subjectId}>
              <td className="p-2 font-semibold">{placement.name}</td>
              <td className="p-2">
                <select
                  aria-label={`Año de ${placement.name}`}
                  className={selectClass}
                  onChange={(event) => {
                    const value = event.target.value;
                    void onPlace(placement, { year: value === OPTATIVA ? null : Number(value) });
                  }}
                  value={placement.year ?? OPTATIVA}
                >
                  <YearOptions />
                </select>
              </td>
              <td className="p-2">
                {placement.semester === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <select
                    aria-label={`Cuatrimestre de ${placement.name}`}
                    className={selectClass}
                    onChange={(event) =>
                      void onPlace(placement, {
                        semester: Number(event.target.value) as Semester,
                      })
                    }
                    value={placement.semester}
                  >
                    {SEMESTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td className="p-2 text-right">
                <Button
                  aria-label={`Quitar ${placement.name}`}
                  onClick={() => void onRemove(placement)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Quitar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddPlacement({
  careerId,
  facultyId,
  onAdded,
  subjects,
}: {
  careerId: string;
  facultyId: string;
  onAdded: () => Promise<void>;
  subjects: AdminSubject[];
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [year, setYear] = useState<number | typeof OPTATIVA>(1);
  const [semester, setSemester] = useState<Semester>(1);
  const [credits, setCredits] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        Agregar materia
      </Button>
    );
  }

  const isNew = subjectId === '__new';
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!subjectId) return setError('Elegí una materia.');
    if (isNew && !name.trim()) return setError('Escribí el nombre de la materia nueva.');
    if (isNew && code && !SLUG.test(code.trim())) return setError(`Código: ${SLUG_HINT}`);
    setError(null);
    try {
      // A materia created on an earlier try whose placement failed is reused,
      // so a retry never creates a second one.
      let target = isNew ? created : subjectId;
      if (!target) {
        target = (
          await catalogAdmin.createSubject({
            facultyId,
            name: name.trim(),
            ...(code.trim() ? { code: code.trim() } : {}),
          })
        ).id;
        setCreated(target);
      }
      await catalogAdmin.setPlacement(
        careerId,
        target,
        placementBody(year, semester, credits ? Number(credits) : null),
      );
      setOpen(false);
      setSubjectId('');
      setName('');
      setCode('');
      setCreated(null);
      await onAdded();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <form
      aria-label="Agregar materia"
      className="grid gap-3 rounded-2xl border-[1.5px] border-line bg-background p-4 sm:grid-cols-2"
      onSubmit={submit}
    >
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${id}-subject`}>Materia</FieldLabel>
        <select
          className={selectClass}
          id={`${id}-subject`}
          onChange={(event) => setSubjectId(event.target.value)}
          value={subjectId}
        >
          <option value="">Elegí una materia de la facultad</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
          <option value="__new">Materia nueva…</option>
        </select>
      </Field>
      {isNew ? (
        <>
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>Nombre</FieldLabel>
            <Input
              id={`${id}-name`}
              onBlur={async () => {
                if (name.trim() && !code) {
                  setCode(await catalogAdmin.codeProposal(facultyId, name.trim()).catch(() => ''));
                }
              }}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-code`}>Código</FieldLabel>
            <Input
              id={`${id}-code`}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Se propone al escribir el nombre"
              value={code}
            />
          </Field>
        </>
      ) : null}
      <Field>
        <FieldLabel htmlFor={`${id}-year`}>Año</FieldLabel>
        <select
          className={selectClass}
          id={`${id}-year`}
          onChange={(event) => {
            const value = event.target.value;
            setYear(value === OPTATIVA ? OPTATIVA : Number(value));
          }}
          value={year}
        >
          <YearOptions />
        </select>
      </Field>
      {year === OPTATIVA ? null : (
        <Field>
          <FieldLabel htmlFor={`${id}-semester`}>Cuatrimestre</FieldLabel>
          <select
            className={selectClass}
            id={`${id}-semester`}
            onChange={(event) => setSemester(Number(event.target.value) as Semester)}
            value={semester}
          >
            {SEMESTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field>
        <FieldLabel htmlFor={`${id}-credits`}>Créditos (opcional)</FieldLabel>
        <Input
          id={`${id}-credits`}
          inputMode="numeric"
          onChange={(event) => setCredits(event.target.value.replace(/\D/g, ''))}
          value={credits}
        />
      </Field>
      <FieldError className="sm:col-span-2">{error}</FieldError>
      <div className="flex gap-2 sm:col-span-2">
        <Button size="sm" type="submit">
          Agregar
        </Button>
        <Button onClick={() => setOpen(false)} size="sm" type="button" variant="ghost">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

const PLACEMENT_LABEL = {
  add: 'Se agrega',
  update: 'Cambia de lugar',
  unchanged: 'Sin cambios',
} as const;

/**
 * «Leer plan con IA» (openspec academic-structure/plan-reading): fills the
 * carga masiva box with what the AI read from the plan link, for the admin to
 * preview. It never changes the carrera by itself.
 */
function PlanReader({
  careerId,
  hasText,
  onRead,
}: {
  careerId: string;
  hasText: boolean;
  onRead: (text: string) => void;
}) {
  const [reading, setReading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<PlanReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = async () => {
    setConfirming(false);
    setError(null);
    setReading(true);
    try {
      const reading = await catalogAdmin.readPlan(careerId);
      setResult(reading);
      onRead(reading.text);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="grid gap-2 rounded-xl border-[1.5px] border-dashed border-line p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={reading}
          onClick={() => (hasText ? setConfirming(true) : void read())}
          size="sm"
          type="button"
          variant="outline"
        >
          {reading ? 'Leyendo el plan…' : 'Leer plan con IA'}
        </Button>
        <p className="text-xs text-muted-foreground">
          La IA propone las materias desde el plan oficial; revisalas en la vista previa antes de
          confirmar.
        </p>
      </div>
      {reading ? (
        <p className="text-sm" role="status">
          Leyendo el plan… puede tardar hasta un par de minutos.
        </p>
      ) : null}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2" role="group">
          <p className="text-sm font-semibold">
            El cuadro ya tiene texto. ¿Reemplazarlo con lo que lea la IA?
          </p>
          <Button onClick={() => void read()} size="sm" type="button">
            Leer y reemplazar
          </Button>
          <Button onClick={() => setConfirming(false)} size="sm" type="button" variant="ghost">
            Cancelar lectura
          </Button>
        </div>
      ) : null}
      <FieldError>{error}</FieldError>
      {result ? (
        <div className="grid gap-1 text-sm">
          {result.sources.length > 0 ? (
            <p>
              Leído de:{' '}
              {result.sources.map((source, index) => (
                // The same address can be read twice, after a redirect.
                <span key={index}>
                  {index > 0 ? ', ' : null}
                  <a
                    className="font-semibold underline break-all"
                    href={source.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {source.url}
                  </a>
                </span>
              ))}
            </p>
          ) : null}
          {result.notices.length > 0 ? (
            <ul aria-label="Avisos de la lectura" className="list-disc pl-5">
              {result.notices.map((notice, index) => (
                // The model can repeat a notice.
                <li key={index}>{notice}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Paste → preview → adjust each row → confirm, all or nothing. */
function BulkLoad({
  careerId,
  facultyId,
  onApplied,
  plan,
}: {
  careerId: string;
  facultyId: string;
  onApplied: () => Promise<void>;
  /** A carrera en borrador can be read from its plan link; null without one. */
  plan?: string | null;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [rows, setRows] = useState<BulkPreviewRow[] | null>(null);
  const [original, setOriginal] = useState<Map<number, string | null>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="grid gap-2">
        <Button onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
          Carga masiva
        </Button>
        {result ? (
          <p className="text-sm font-semibold" role="status">
            {result}
          </p>
        ) : null}
      </div>
    );
  }

  const preview = async () => {
    setError(null);
    try {
      const preview = await catalogAdmin.bulkPreview(careerId, text);
      setOriginal(new Map(preview.map((row) => [row.line, row.code])));
      setRows(preview);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  /**
   * The reused materia's code is taken: a row switched to «new» gets a fresh
   * proposal, and switching back restores the code of the materia it reuses.
   */
  const switchAction = async (row: BulkPreviewRow, action: 'reuse' | 'new') => {
    if (action === 'reuse') {
      return update(row.line, { action, code: original.get(row.line) ?? null });
    }
    update(row.line, { action, code: '' });
    const code = await catalogAdmin.codeProposal(facultyId, row.name).catch(() => '');
    update(row.line, { code });
  };

  const update = (line: number, change: Partial<BulkPreviewRow>) =>
    setRows((current) =>
      (current ?? []).map((row) => (row.line === line ? { ...row, ...change } : row)),
    );

  const apply = async () => {
    if (!rows) return;
    const payload: BulkRow[] = rows.map((row) => ({
      ...(row.action === 'reuse'
        ? { action: 'reuse' as const, subjectId: row.subjectId! }
        : { action: 'new' as const, name: row.name, code: (row.code ?? '').trim() }),
      ...placementBody(row.optativa ? OPTATIVA : row.year!, row.semester ?? 1, row.credits),
    }));
    setError(null);
    try {
      const done = await catalogAdmin.bulkApply(careerId, payload);
      setResult(
        `Listo: ${done.created} materias nuevas, ${done.added} agregadas, ${done.updated} actualizadas.`,
      );
      setRows(null);
      setText('');
      setOpen(false);
      await onApplied();
    } catch (caught) {
      const data = catalogError(caught);
      setError(
        [
          data.message ?? errorMessage(caught),
          ...(data.errors ?? []).map((e) => `Fila ${e.index + 1}: ${e.message}`),
        ].join(' '),
      );
    }
  };

  const invalid = (rows ?? []).some(
    (row) =>
      row.action === 'invalid' || (row.action === 'new' && !SLUG.test((row.code ?? '').trim())),
  );

  return (
    <div className="grid gap-3 rounded-2xl border-[1.5px] border-line bg-background p-4">
      {plan ? (
        <PlanReader
          careerId={careerId}
          hasText={text.trim() !== ''}
          onRead={(read) => {
            setText(read);
            setRows(null);
          }}
        />
      ) : plan === null ? (
        <p className="text-sm text-muted-foreground">
          Para leer el plan con IA, agregá el link al plan oficial de la carrera.
        </p>
      ) : null}
      <Field>
        <FieldLabel htmlFor={`${id}-text`}>
          Una materia por línea: año;cuatrimestre;nombre;créditos (cuatrimestre 1, 2 o A para anual;
          O;;nombre para una optativa)
        </FieldLabel>
        <textarea
          className="min-h-40 rounded-md border-[1.5px] border-input bg-card p-3 font-mono text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          id={`${id}-text`}
          onChange={(event) => setText(event.target.value)}
          placeholder={'1;1;Análisis Matemático I;8\n1;A;Física General\nO;;Robótica;6'}
          value={text}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!text.trim()} onClick={() => void preview()} size="sm" type="button">
          Vista previa
        </Button>
        <Button onClick={() => setOpen(false)} size="sm" type="button" variant="ghost">
          Cerrar
        </Button>
      </div>

      {rows ? (
        <>
          <div className="overflow-x-auto">
            <table aria-label="Vista previa" className="w-full min-w-[44rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="p-2" scope="col">
                    Línea
                  </th>
                  <th className="p-2" scope="col">
                    Materia
                  </th>
                  <th className="p-2" scope="col">
                    Lugar
                  </th>
                  <th className="p-2" scope="col">
                    Qué pasa
                  </th>
                  <th className="p-2" scope="col">
                    <span className="sr-only">Quitar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-line align-top" key={row.line}>
                    <td className="p-2">{row.line}</td>
                    <td className="p-2 font-semibold">{row.name || '—'}</td>
                    <td className="p-2">
                      {row.optativa && row.action !== 'invalid'
                        ? 'Optativa'
                        : row.year && row.semester !== null
                          ? `${row.year}.º año · ${SEMESTERS.find((s) => s.value === row.semester)?.label}`
                          : '—'}
                    </td>
                    <td className="grid gap-2 p-2">
                      {row.action === 'invalid' ? (
                        <ul className="text-sm font-bold text-destructive">
                          {row.errors.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      ) : (
                        <>
                          {row.action === 'reuse' ? (
                            <span>Se reutiliza</span>
                          ) : (
                            <Input
                              aria-label={`Código de la línea ${row.line}`}
                              onChange={(event) => update(row.line, { code: event.target.value })}
                              value={row.code ?? ''}
                            />
                          )}
                          {row.subjectId ? (
                            <select
                              aria-label={`Acción de la línea ${row.line}`}
                              className={selectClass}
                              onChange={(event) =>
                                void switchAction(row, event.target.value as 'reuse' | 'new')
                              }
                              value={row.action}
                            >
                              <option value="reuse">Usar la materia existente</option>
                              <option value="new">Crear una materia nueva</option>
                            </select>
                          ) : null}
                          {row.placement ? (
                            <span className="text-xs text-muted-foreground">
                              {PLACEMENT_LABEL[row.placement]}
                            </span>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        aria-label={`Quitar la línea ${row.line}`}
                        onClick={() =>
                          setRows((current) => (current ?? []).filter((r) => r.line !== row.line))
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Quitar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Solo agrega o actualiza: las materias que no estén en la lista siguen en la carrera.
          </p>
          <Button
            disabled={invalid || rows.length === 0}
            onClick={() => void apply()}
            type="button"
          >
            Confirmar carga
          </Button>
        </>
      ) : null}
      <FieldError>{error}</FieldError>
    </div>
  );
}
