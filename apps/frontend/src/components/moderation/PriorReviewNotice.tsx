import { Clock } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/shadcn';
import { type PriorReviewReason, priorReviewReasonText } from '@/lib/publication-outcome';

/** Shown after submitting a contribution that waits for revisión previa. */
export function PriorReviewNotice({
  backHref,
  reason,
}: {
  backHref: string;
  reason: PriorReviewReason | 'RESUBMITTED';
}) {
  return (
    <section className="mx-auto grid max-w-2xl gap-4 px-5 py-14 text-center font-sans">
      <Clock aria-hidden="true" className="mx-auto size-10 text-primary" />
      <h1 className="text-4xl font-extrabold tracking-[-0.04em]">En revisión previa</h1>
      <p className="text-muted-foreground">
        {reason === 'RESUBMITTED'
          ? 'Lo reenviaste: moderación lo revisa de nuevo antes de publicarlo.'
          : priorReviewReasonText[reason]}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/profile/me#mis-envios">Ver mis envíos</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={backHref}>Volver a la materia</Link>
        </Button>
      </div>
    </section>
  );
}

/** One-line reminder of the publication rules for contribution forms. */
export function PublicationRulesNote() {
  return (
    <p className="font-sans text-sm leading-relaxed text-muted-foreground">
      Se publica al instante. Que esté publicado no significa que sea correcto: si algo no cumple
      las{' '}
      <Link className="font-semibold text-link underline underline-offset-4" href="/normas">
        Normas de la comunidad
      </Link>
      , se puede reportar.
    </p>
  );
}
