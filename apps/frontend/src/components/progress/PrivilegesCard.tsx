'use client';

import { useEffect, useState } from 'react';

import { getMyPrivileges, type Missing, type MyPrivileges } from '@/lib/trust-client';

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Argentina/Jujuy',
});

/** What is missing for a privilege, in plain language. */
function missingText(missing: Missing) {
  switch (missing.kind) {
    case 'LEVEL':
      return `Se desbloquea en el Nv. ${missing.needed}.`;
    case 'CONFIRMED_REPORTS': {
      const left = missing.needed - missing.current;
      return `Te ${left === 1 ? 'falta 1 reporte confirmado' : `faltan ${left} reportes confirmados`} en los últimos 90 días.`;
    }
    case 'PRECISION':
      return `Tu precisión es ${missing.current} %; hacen falta ${missing.needed} %.`;
    case 'STANDING':
      return missing.until
        ? `Vuelve el ${dateFormat.format(new Date(missing.until))}, a 90 días de tu última sanción o retiro.`
        : 'No vuelven: la suspensión es permanente.';
  }
}

const PRIVILEGES: { key: 'suggestCorrections' | 'priorityReports'; name: string; what: string }[] =
  [
    {
      key: 'suggestCorrections',
      name: 'Sugerir correcciones',
      what: 'Proponé el tipo, la materia, el ciclo o el profesor correcto de un material ajeno.',
    },
    {
      key: 'priorityReports',
      name: 'Reportes prioritarios',
      what: 'Tus reportes se revisan antes que los demás.',
    },
  ];

/**
 * Privilegios de confianza in «Tu progreso» (openspec
 * reputation/trust-privileges). Only the account sees it, and it never says
 * whether the account could be invited to moderate.
 */
export function PrivilegesCard() {
  const [privileges, setPrivileges] = useState<MyPrivileges | null>(null);

  useEffect(() => {
    let active = true;
    getMyPrivileges()
      .then((data) => {
        if (active) setPrivileges(data);
      })
      // A convenience: «Tu progreso» works without it.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!privileges) return null;

  return (
    <section
      aria-labelledby="privilegios-heading"
      className="rounded-2xl border-[1.5px] border-foreground bg-card p-5 font-sans"
    >
      <h2 className="text-xl font-extrabold tracking-[-0.03em]" id="privilegios-heading">
        Privilegios de confianza
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Llegan con tu nivel y tu buen criterio, y requieren 90 días sin sanciones.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {PRIVILEGES.map(({ key, name, what }) => {
          const privilege = privileges[key];
          return (
            <li
              className="grid gap-1 rounded-xl border-[1.5px] border-border p-4 text-sm"
              key={key}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold">{name}</span>
                <span
                  className={
                    privilege.active
                      ? 'rounded-full bg-success-ink px-2 py-0.5 text-xs font-bold text-background'
                      : 'rounded-full bg-muted px-2 py-0.5 text-xs font-bold'
                  }
                >
                  {privilege.active ? 'Activo' : 'Todavía no'}
                </span>
              </span>
              <span className="text-secondary-foreground">{what}</span>
              {privilege.missing.map((missing) => (
                <span className="font-semibold" key={missing.kind}>
                  {missingText(missing)}
                </span>
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
