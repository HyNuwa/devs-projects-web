import Link from 'next/link';
import { PenLine } from 'lucide-react';

import { Button } from '@/components/ui/shadcn';

/** The pink «TU TURNO» aside card inviting to write an experiencia. */
export function YourTurn() {
  return (
    <aside className="relative flex min-h-[15rem] flex-col overflow-hidden rounded-2xl border-[1.5px] border-foreground bg-[#FECDDD] p-5">
      <p className="font-mono text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-[#C31B5E]">
        Tu turno
      </p>
      <h3 className="mt-2.5 max-w-[13rem] font-sans text-[1.375rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-foreground">
        ¿Ya la cursaste o la rendiste?
      </h3>
      <p className="mt-2.5 max-w-[12rem] font-sans text-[0.8125rem] font-medium leading-relaxed text-[#6A3E50]">
        Contá cómo te fue. Podés publicar como anónimo.
      </p>
      <div className="mt-auto pt-4">
        <Button asChild size="sm">
          <Link href="/experiencias/escribir">
            <PenLine aria-hidden="true" className="size-4" strokeWidth={2} />
            Escribir experiencia
          </Link>
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative canvas illustration */}
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 -right-4 w-32"
        src="/assets/gato-escribe.png"
      />
    </aside>
  );
}
