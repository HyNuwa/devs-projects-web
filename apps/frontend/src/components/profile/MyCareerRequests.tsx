'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/shadcn';
import { getApiError } from '@/lib/apiHelpers';
import {
  getMyRequests,
  unsupportRequest,
  withdrawRequest,
  type CareerRequestStatus,
  type MyCareerRequest,
} from '@/lib/career-requests-client';

const STATUS_LABEL: Record<CareerRequestStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'La estamos cargando',
  PUBLISHED: 'Publicada',
  REJECTED: 'No la vamos a sumar',
  ALREADY_LOADED: 'Ya estaba cargada',
  WITHDRAWN: 'Retirada',
};

/** «Mis solicitudes»: what the student asked for or joined (career-requests). */
export function MyCareerRequests() {
  const [requests, setRequests] = useState<MyCareerRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await getMyRequests());
    } catch (caught) {
      setError(getApiError(caught));
    }
  }, []);

  useEffect(() => {
    getMyRequests()
      .then(setRequests)
      .catch((caught: unknown) => setError(getApiError(caught)));
  }, []);

  const act = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      await load();
    } catch (caught) {
      setError(getApiError(caught));
    }
  };

  return (
    <section
      aria-labelledby="mis-solicitudes-heading"
      className="grid gap-4 font-sans"
      id="mis-solicitudes"
    >
      <div className="grid gap-1">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em]" id="mis-solicitudes-heading">
          Mis solicitudes
        </h2>
        <p className="text-sm text-muted-foreground">
          Las carreras que pediste o a las que te sumaste. Te escribimos cuando las resolvemos.
        </p>
      </div>

      {requests?.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pediste ninguna carrera.{' '}
          <Link
            className="font-bold text-link underline-offset-4 hover:underline"
            href="/universidades/pedir"
          >
            Pedí tu carrera
          </Link>
        </p>
      ) : null}

      {requests && requests.length > 0 ? (
        <ul className="grid gap-3">
          {requests.map((request) => (
            <li
              className="grid gap-2 rounded-xl border-[1.5px] border-border bg-card p-4 text-sm"
              key={request.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold">{request.careerName}</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-link">
                  {STATUS_LABEL[request.status]}
                </span>
              </div>
              <p className="text-muted-foreground">
                {request.faculty} ·{' '}
                {request.count === 1 ? '1 estudiante' : `${request.count} estudiantes`}
              </p>
              {request.status === 'REJECTED' && request.rejectionReason ? (
                <p>Motivo: {request.rejectionReason}</p>
              ) : null}
              {request.career ? (
                <Link
                  className="font-bold text-link underline-offset-4 hover:underline"
                  href={request.career.path}
                >
                  Ver {request.career.name} →
                </Link>
              ) : null}
              {request.status === 'PENDING' ? (
                <div>
                  {request.mine ? (
                    <Button
                      onClick={() => void act(() => withdrawRequest(request.id))}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Retirar
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void act(() => unsupportRequest(request.id))}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Ya no me interesa
                    </Button>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="text-sm font-semibold text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
