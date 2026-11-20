'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, FieldError } from '@/components/ui/shadcn';
import { catalogAdmin, type AdminSubject, type AliasHolder } from '@/lib/catalog-admin-client';

import { errorMessage, TextFields, trimmed, validate, type FieldSpec } from './CatalogForms';

const SUBJECT_FIELDS: FieldSpec[] = [
  { name: 'name', label: 'Nombre' },
  { name: 'code', label: 'Código', slug: true },
];

/** The materias of a facultad, to rename, recode or delete them (catalog-editing). */
export function SubjectList({
  facultyId,
  onChanged,
}: {
  facultyId: string;
  onChanged: () => Promise<void>;
}) {
  const [subjects, setSubjects] = useState<AdminSubject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSubjects(await catalogAdmin.subjects(facultyId));
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, [facultyId]);

  useEffect(() => {
    catalogAdmin
      .subjects(facultyId)
      .then(setSubjects)
      .catch((caught: unknown) => setError(errorMessage(caught)));
  }, [facultyId]);

  const changed = async () => {
    await Promise.all([load(), onChanged()]);
  };

  return (
    <section
      aria-label="Materias de la facultad"
      className="grid gap-3 rounded-2xl border-[1.5px] border-line bg-card p-5"
    >
      <h3 className="text-lg font-extrabold tracking-[-0.03em]">Materias</h3>
      <FieldError>{error}</FieldError>
      {subjects?.length === 0 ? (
        <p className="text-sm text-muted-foreground">La facultad todavía no tiene materias.</p>
      ) : null}
      <ul className="grid gap-2">
        {(subjects ?? []).map((subject) => (
          <li key={subject.id}>
            {editing === subject.id ? (
              <SubjectEditor
                onClose={() => setEditing(null)}
                onDeleted={async () => {
                  setEditing(null);
                  await changed();
                }}
                onSaved={changed}
                subject={subject}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {subject.name}
                  {subject.code ? (
                    <span className="ml-2 text-xs text-muted-foreground">{subject.code}</span>
                  ) : null}
                </span>
                <Button
                  aria-label={`Editar ${subject.name}`}
                  onClick={() => setEditing(subject.id)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Editar
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SubjectEditor({
  onClose,
  onDeleted,
  onSaved,
  subject,
}: {
  onClose: () => void;
  onDeleted: () => Promise<void>;
  onSaved: () => Promise<void>;
  subject: AdminSubject;
}) {
  const initial = { name: subject.name, code: subject.code ?? '' };
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [holder, setHolder] = useState<AliasHolder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async (confirmed = false) => {
    const problem = validate(SUBJECT_FIELDS, values);
    if (problem) return setError(problem);
    const clean = trimmed(values);
    setError(null);
    try {
      if (!confirmed && clean.code.toLowerCase() !== initial.code.toLowerCase()) {
        const alias = await catalogAdmin.slugCheck('SUBJECT', null, clean.code);
        if (alias && alias.id !== subject.id) {
          setHolder(alias);
          return;
        }
      }
      setHolder(null);
      await catalogAdmin.updateSubject(subject.id, { name: clean.name, code: clean.code });
      setNotice('Guardado.');
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await catalogAdmin.remove('SUBJECT', subject.id);
      await onDeleted();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <form
      aria-label={`Editar materia ${subject.name}`}
      className="grid gap-3 rounded-2xl border-[1.5px] border-foreground bg-background p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <TextFields fields={SUBJECT_FIELDS} onChange={setValues} values={values} />
      {holder ? (
        <div
          className="grid gap-3 rounded-xl border-[1.5px] border-destructive bg-destructive/10 p-4 text-sm font-semibold"
          role="status"
        >
          <p>
            «{values.code.trim().toLowerCase()}» hoy redirige a {holder.name}; dejará de hacerlo.
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
        <Button size="sm" type="submit">
          Guardar
        </Button>
        {confirmDelete ? (
          <>
            <Button onClick={() => void remove()} size="sm" type="button" variant="destructive">
              Sí, borrar
            </Button>
            <Button onClick={() => setConfirmDelete(false)} size="sm" type="button" variant="ghost">
              No
            </Button>
          </>
        ) : (
          <Button onClick={() => setConfirmDelete(true)} size="sm" type="button" variant="ghost">
            Borrar
          </Button>
        )}
        <Button onClick={onClose} size="sm" type="button" variant="ghost">
          Cerrar
        </Button>
      </div>
    </form>
  );
}
