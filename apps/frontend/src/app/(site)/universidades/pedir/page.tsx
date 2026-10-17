import type { Metadata } from 'next';

import { CareerRequestForm } from '@/components/catalog/CareerRequestForm';

export const metadata: Metadata = {
  title: 'Pedí tu carrera - DevsProject',
  description: 'Pedí que sumemos tu carrera con el link a su plan de estudios oficial.',
  robots: { index: false },
};

type Props = { searchParams: Promise<{ facultad?: string | string[] }> };

export default async function AskForCareerPage({ searchParams }: Props) {
  const { facultad } = await searchParams;
  const facultyId = typeof facultad === 'string' ? facultad : undefined;
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 font-sans">
      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-link">Universidades</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
          Pedí tu carrera<span className="text-primary">.</span>
        </h1>
        <p className="max-w-[60ch] text-muted-foreground">
          Dejanos el link al plan de estudios oficial y la cargamos. Si alguien ya la pidió, sumate:
          así sabemos cuáles cargar primero.
        </p>
      </div>
      <CareerRequestForm facultyId={facultyId} />
    </div>
  );
}
