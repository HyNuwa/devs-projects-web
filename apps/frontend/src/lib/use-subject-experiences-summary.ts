'use client';

import { useEffect, useState } from 'react';

import {
  getSubjectExperiencesSummary,
  type SubjectExperiencesSummary,
} from '@/lib/experiences-client';

type SummaryKey = { code: string; revision: number };

export type SummaryState =
  | ({ status: 'loading' } & SummaryKey)
  | ({ status: 'error' } & SummaryKey)
  | ({ status: 'ready'; summary: SubjectExperiencesSummary } & SummaryKey);

/**
 * Fetches the public materia summary. Each state carries the code/revision it
 * belongs to, so obsolete replies never render; `retry` re-issues the request.
 */
export function useSubjectExperiencesSummary(code: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<SummaryState | null>(null);
  const key = { code, revision };

  useEffect(() => {
    let current = true;
    getSubjectExperiencesSummary(code)
      .then((summary) => {
        if (current) setState({ code, revision, status: 'ready', summary });
      })
      .catch(() => {
        if (current) setState({ code, revision, status: 'error' });
      });
    return () => {
      current = false;
    };
  }, [code, revision]);

  const stateForKey: SummaryState =
    state && state.code === key.code && state.revision === key.revision
      ? state
      : { status: 'loading', ...key };

  return { retry: () => setRevision((value) => value + 1), state: stateForKey };
}
