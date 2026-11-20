'use client';

import { useEffect, useState } from 'react';

import { getInstitutions, type InstitutionTree } from '@/lib/study-plans-client';

/**
 * Checkboxes with every facultad, for an admin choosing what a moderator
 * covers (openspec moderation/scope, «Assigning facultades»).
 */
export function FacultyChecklist({
  legend,
  selected,
  onChange,
  disabled,
}: {
  legend: string;
  selected: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [tree, setTree] = useState<InstitutionTree | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getInstitutions()
      .then((institutions) => {
        if (active) setTree(institutions);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);

  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="text-sm font-bold">{legend}</legend>
      {failed ? (
        <p className="text-xs text-muted-foreground">No pudimos cargar las facultades.</p>
      ) : !tree ? (
        <p className="text-xs text-muted-foreground">Cargando facultades…</p>
      ) : (
        <div className="grid max-h-48 gap-1 overflow-y-auto">
          {tree.flatMap((university) =>
            university.faculties.map((faculty) => (
              <label className="flex min-h-9 items-center gap-2 text-sm" key={faculty.id}>
                <input
                  checked={selected.includes(faculty.id)}
                  className="size-4 accent-primary"
                  onChange={() => toggle(faculty.id)}
                  type="checkbox"
                />
                {faculty.shortName} · {university.shortName}
              </label>
            )),
          )}
        </div>
      )}
    </fieldset>
  );
}
