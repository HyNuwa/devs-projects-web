'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ModerationHeader } from '@/components/moderation/ModerationHeader';
import { Button, EmptyState, ErrorState, FieldError, LoadingState } from '@/components/ui/shadcn';
import { cn } from '@/components/ui/shadcn/utils';
import {
  catalogAdmin,
  type AdminCareer,
  type AdminFaculty,
  type AdminUniversity,
  type AliasHolder,
  type CatalogKind,
} from '@/lib/catalog-admin-client';
import { useAuthStore } from '@/stores/authStore';

import { CareerEditor } from './CareerEditor';
import {
  CreateForm,
  errorMessage,
  TextFields,
  trimmed,
  validate,
  type FieldSpec,
} from './CatalogForms';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

const LEVEL_FIELDS: FieldSpec[] = [
  { name: 'name', label: 'Nombre' },
  { name: 'shortName', label: 'Nombre corto', slug: true },
];
const CAREER_FIELDS: FieldSpec[] = [
  { name: 'name', label: 'Nombre' },
  { name: 'code', label: 'Código', slug: true },
  {
    name: 'planUrl',
    label: 'Link al plan oficial',
    optional: true,
    type: 'url',
    placeholder: 'https://',
  },
];

type Selected =
  | { kind: 'UNIVERSITY'; entity: AdminUniversity; parentId: null }
  | { kind: 'FACULTY'; entity: AdminFaculty; parentId: string }
  | { kind: 'CAREER'; entity: AdminCareer; parentId: string };

/** The Catálogo tab: the tree and the editor of what is selected (catalog-editing). */
export function CatalogPanel() {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = Boolean(role && ADMIN_ROLES.has(role));
  const [universities, setUniversities] = useState<AdminUniversity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<Record<string, AdminFaculty[]>>({});
  const [careers, setCareers] = useState<Record<string, AdminCareer[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Selected | null>(null);

  const loadUniversities = useCallback(async () => {
    try {
      setUniversities(await catalogAdmin.universities());
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, []);
  const loadFaculties = useCallback(async (universityId: string) => {
    const list = await catalogAdmin.faculties(universityId);
    setFaculties((current) => ({ ...current, [universityId]: list }));
  }, []);
  const loadCareers = useCallback(async (facultyId: string) => {
    const list = await catalogAdmin.careers(facultyId);
    setCareers((current) => ({ ...current, [facultyId]: list }));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    catalogAdmin
      .universities()
      .then(setUniversities)
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

  const toggle = async (id: string, load: () => Promise<void>) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      await load();
    }
    setExpanded(next);
  };

  /** After a change, reload the list the entity lives in. */
  const refresh = async (target: Selected) => {
    if (target.kind === 'UNIVERSITY') await loadUniversities();
    if (target.kind === 'FACULTY')
      await Promise.all([loadFaculties(target.parentId), loadUniversities()]);
    if (target.kind === 'CAREER') await loadCareers(target.parentId);
  };

  return (
    <div className="grid gap-6 font-sans">
      <ModerationHeader
        active="catalogo"
        description="Universidades, facultades, carreras y materias. Las carreras nuevas quedan en borrador hasta que las publiques."
      />
      <CatalogNav active="arbol" />

      {error ? <ErrorState description={error} heading="No pudimos cargar el catálogo" /> : null}
      {!universities && !error ? <LoadingState heading="Cargando catálogo" /> : null}
      {universities ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="grid gap-3">
            <CreateForm
              fields={LEVEL_FIELDS}
              label="Nueva universidad"
              onCreate={async (values) => {
                await catalogAdmin.createUniversity({
                  name: values.name,
                  shortName: values.shortName,
                });
                await loadUniversities();
              }}
            />
            <ul
              aria-label="Catálogo"
              className="grid gap-1 rounded-2xl border-[1.5px] border-border bg-card p-3"
              role="tree"
            >
              {universities.map((university) => (
                <TreeNode
                  editLabel={university.shortName}
                  expanded={expanded.has(university.id)}
                  key={university.id}
                  label={`${university.shortName} · ${university.name}`}
                  onEdit={() =>
                    setSelected({ kind: 'UNIVERSITY', entity: university, parentId: null })
                  }
                  onToggle={() => toggle(university.id, () => loadFaculties(university.id))}
                  selected={selected?.entity.id === university.id}
                >
                  {(faculties[university.id] ?? []).map((faculty) => (
                    <TreeNode
                      editLabel={faculty.shortName}
                      expanded={expanded.has(faculty.id)}
                      key={faculty.id}
                      label={`${faculty.shortName} · ${faculty.name}`}
                      onEdit={() =>
                        setSelected({ kind: 'FACULTY', entity: faculty, parentId: university.id })
                      }
                      onToggle={() => toggle(faculty.id, () => loadCareers(faculty.id))}
                      selected={selected?.entity.id === faculty.id}
                    >
                      {(careers[faculty.id] ?? []).map((career) => (
                        <TreeNode
                          badge={career.status === 'DRAFT' ? 'Borrador' : undefined}
                          editLabel={career.name}
                          key={career.id}
                          label={career.name}
                          onEdit={() =>
                            setSelected({ kind: 'CAREER', entity: career, parentId: faculty.id })
                          }
                          selected={selected?.entity.id === career.id}
                        />
                      ))}
                      {careers[faculty.id]?.length === 0 ? (
                        <li className="px-3 py-1 text-sm text-muted-foreground" role="none">
                          Sin carreras.
                        </li>
                      ) : null}
                    </TreeNode>
                  ))}
                </TreeNode>
              ))}
            </ul>
          </div>

          <section aria-label="Editor" className="grid gap-4">
            {selected ? (
              <EntityEditor
                key={`${selected.kind}-${selected.entity.id}`}
                onChildCreated={async () => {
                  if (selected.kind === 'UNIVERSITY') {
                    await loadFaculties(selected.entity.id);
                    setExpanded((current) => new Set(current).add(selected.entity.id));
                    await loadUniversities();
                  }
                  if (selected.kind === 'FACULTY') {
                    await loadCareers(selected.entity.id);
                    setExpanded((current) => new Set(current).add(selected.entity.id));
                  }
                }}
                onChanged={() => refresh(selected)}
                onSaved={(fields) =>
                  setSelected({
                    ...selected,
                    entity: { ...selected.entity, ...fields },
                  } as Selected)
                }
                onDeleted={async () => {
                  await refresh(selected);
                  setSelected(null);
                }}
                selected={selected}
              />
            ) : (
              <p className="rounded-2xl border-[1.5px] border-dashed border-line p-6 text-sm font-semibold text-muted-foreground">
                Elegí una universidad, facultad o carrera para editarla.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

/** «Árbol» and «Solicitudes» inside the Catálogo tab. */
export function CatalogNav({
  active,
  pending,
}: {
  active: 'arbol' | 'solicitudes';
  pending?: number;
}) {
  const links = [
    { id: 'arbol', label: 'Árbol', href: '/admin/catalogo' },
    {
      id: 'solicitudes',
      label: pending ? `Solicitudes (${pending})` : 'Solicitudes',
      href: '/admin/catalogo/solicitudes',
    },
  ] as const;
  return (
    <nav aria-label="Catálogo" className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          aria-current={active === link.id ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
            active === link.id
              ? 'border-foreground bg-foreground text-background'
              : 'border-line hover:border-foreground',
          )}
          href={link.href}
          key={link.id}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function TreeNode({
  badge,
  children,
  editLabel,
  expanded,
  label,
  onEdit,
  onToggle,
  selected,
}: {
  badge?: string;
  children?: React.ReactNode;
  editLabel: string;
  expanded?: boolean;
  label: string;
  onEdit: () => void;
  onToggle?: () => void;
  selected: boolean;
}) {
  return (
    <li
      aria-expanded={onToggle ? Boolean(expanded) : undefined}
      aria-selected={selected}
      role="treeitem"
    >
      <div className={cn('flex items-center gap-1 rounded-lg', selected && 'bg-secondary')}>
        {onToggle ? (
          <button
            aria-label={label}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-lg px-2 text-left text-sm font-bold outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
            onClick={onToggle}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn('size-4 shrink-0 transition-transform', expanded && 'rotate-90')}
            />
            <span className="min-w-0 truncate">{label}</span>
          </button>
        ) : (
          <span className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 text-sm font-semibold">
            <span className="min-w-0 truncate">{label}</span>
            {badge ? (
              <span className="shrink-0 rounded-full bg-secondary px-2 text-xs font-bold text-link">
                {badge}
              </span>
            ) : null}
          </span>
        )}
        <Button
          aria-label={`Editar ${editLabel}`}
          onClick={onEdit}
          size="sm"
          type="button"
          variant="ghost"
        >
          Editar
        </Button>
      </div>
      {onToggle && expanded ? (
        <ul className="ml-4 grid gap-1 border-l border-line pl-2" role="group">
          {children}
        </ul>
      ) : null}
    </li>
  );
}

const slugField = (kind: CatalogKind) => (kind === 'CAREER' ? 'code' : 'shortName');

function EntityEditor({
  onChanged,
  onSaved,
  onChildCreated,
  onDeleted,
  selected,
}: {
  onChanged: () => Promise<void>;
  onSaved: (fields: Record<string, string | null>) => void;
  onChildCreated: () => Promise<void>;
  onDeleted: () => Promise<void>;
  selected: Selected;
}) {
  const { kind, entity, parentId } = selected;
  const fields = kind === 'CAREER' ? CAREER_FIELDS : LEVEL_FIELDS;
  const initial = Object.fromEntries(
    fields.map((field) => [
      field.name,
      String((entity as Record<string, unknown>)[field.name] ?? ''),
    ]),
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [holder, setHolder] = useState<AliasHolder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState(kind === 'CAREER' ? (entity as AdminCareer).status : null);

  const slugKey = slugField(kind);
  const title = kind === 'UNIVERSITY' ? 'Universidad' : kind === 'FACULTY' ? 'Facultad' : 'Carrera';

  const save = async (confirmed = false) => {
    const problem = validate(fields, values);
    if (problem) return setError(problem);
    const clean = trimmed(values);
    const slug = clean[slugKey];
    setError(null);
    try {
      if (!confirmed && slug.toLowerCase() !== initial[slugKey].toLowerCase()) {
        const alias = await catalogAdmin.slugCheck(kind, parentId, slug);
        if (alias && alias.id !== entity.id) {
          setHolder(alias);
          return;
        }
      }
      setHolder(null);
      if (kind === 'UNIVERSITY') await catalogAdmin.updateUniversity(entity.id, clean);
      if (kind === 'FACULTY') await catalogAdmin.updateFaculty(entity.id, clean);
      if (kind === 'CAREER') {
        await catalogAdmin.updateCareer(entity.id, {
          name: clean.name,
          code: clean.code,
          planUrl: clean.planUrl || null,
        });
      }
      setNotice('Guardado.');
      // The editor compares the next rename against what was just saved.
      onSaved(
        kind === 'CAREER'
          ? { name: clean.name, code: clean.code, planUrl: clean.planUrl || null }
          : { name: clean.name, shortName: clean.shortName },
      );
      await onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await catalogAdmin.remove(kind, entity.id);
      await onDeleted();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  const togglePublished = async () => {
    try {
      if (status === 'DRAFT') {
        await catalogAdmin.publish(entity.id);
        setStatus('PUBLISHED');
        setNotice('Publicada: ya aparece en el recorrido.');
      } else {
        await catalogAdmin.unpublish(entity.id);
        setStatus('DRAFT');
        setNotice('Volvió a borrador.');
      }
      setError(null);
      await onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <>
      <form
        aria-label={`Editar ${title.toLowerCase()}`}
        className="grid gap-4 rounded-2xl border-[1.5px] border-foreground bg-card p-5 shadow-pop"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-extrabold tracking-[-0.04em]">
            {title}: {entity.name}
          </h2>
          {status ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-link">
              {status === 'DRAFT' ? 'Borrador' : 'Publicada'}
            </span>
          ) : null}
        </div>
        <TextFields fields={fields} onChange={setValues} values={values} />
        {holder ? (
          <div
            className="grid gap-3 rounded-xl border-[1.5px] border-destructive bg-destructive/10 p-4 text-sm font-semibold"
            role="status"
          >
            <p>
              «{values[slugKey].trim().toLowerCase()}» hoy redirige a {holder.name}; dejará de
              hacerlo.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => void save(true)} size="sm" type="button">
                Confirmar
              </Button>
              <Button onClick={() => setHolder(null)} size="sm" type="button" variant="ghost">
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
        <FieldError>{error}</FieldError>
        {notice && !error ? (
          <p className="text-sm font-semibold" role="status">
            {notice}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Guardar</Button>
          {status ? (
            <Button onClick={() => void togglePublished()} type="button" variant="outline">
              {status === 'DRAFT' ? 'Publicar' : 'Volver a borrador'}
            </Button>
          ) : null}
          {confirmDelete ? (
            <>
              <Button onClick={() => void remove()} type="button" variant="destructive">
                Sí, borrar
              </Button>
              <Button onClick={() => setConfirmDelete(false)} type="button" variant="ghost">
                No
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmDelete(true)} type="button" variant="ghost">
              Borrar
            </Button>
          )}
        </div>
      </form>

      {kind === 'UNIVERSITY' ? (
        <CreateForm
          fields={LEVEL_FIELDS}
          label="Nueva facultad"
          onCreate={async (created) => {
            await catalogAdmin.createFaculty({
              universityId: entity.id,
              name: created.name,
              shortName: created.shortName,
            });
            await onChildCreated();
          }}
        />
      ) : null}
      {kind === 'FACULTY' ? (
        <CreateForm
          fields={CAREER_FIELDS}
          label="Nueva carrera"
          onCreate={async (created) => {
            await catalogAdmin.createCareer({
              facultyId: entity.id,
              name: created.name,
              code: created.code,
              ...(created.planUrl ? { planUrl: created.planUrl } : {}),
            });
            await onChildCreated();
          }}
        />
      ) : null}
      {kind === 'CAREER' ? <CareerEditor careerId={entity.id} /> : null}
    </>
  );
}
