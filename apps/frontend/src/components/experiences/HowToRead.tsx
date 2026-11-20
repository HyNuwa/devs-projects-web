import { Activity, CalendarDays, Users } from 'lucide-react';

const rules = [
  {
    icon: CalendarDays,
    text: (
      <>
        Cada una cuenta <strong>una cursada o un final concretos</strong>: fijate el ciclo, la
        franja y si era recursada.
      </>
    ),
  },
  {
    icon: Activity,
    text: (
      <>
        La dificultad es <strong>cómo la vivió</strong> quien compartió la experiencia, no una nota.
      </>
    ),
  },
  {
    icon: Users,
    text: (
      <>
        <strong>No hay puntajes de profesores.</strong> Filtrá por el contexto que se parece al
        tuyo.
      </>
    ),
  },
];

/** «Cómo leer una experiencia» — the three rules, verbatim from the canvas. */
export function HowToRead() {
  return (
    <aside className="rounded-2xl border-[1.5px] border-foreground bg-card p-5">
      <h3 className="font-sans text-lg font-extrabold tracking-[-0.03em] text-card-foreground">
        Cómo leer una experiencia
      </h3>
      <ul className="mt-3 grid gap-2.5 font-sans text-[0.8125rem] font-medium leading-relaxed text-secondary-foreground">
        {rules.map((rule, index) => (
          <li className="flex gap-2.5" key={index}>
            <rule.icon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
              strokeWidth={2}
            />
            <span>{rule.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
