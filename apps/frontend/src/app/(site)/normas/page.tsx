import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Normas de la comunidad - DevsProject',
  description: 'Qué se puede compartir en DevsProject y qué pasa cuando algo no cumple.',
};

const principles = [
  ['Compartí lo que te hubiera servido.', 'Materiales claros, completos y de la materia correcta.'],
  [
    'Criticá la cursada, no a las personas.',
    'Contá qué pasó y qué harías distinto, sin insultos ni acusaciones.',
  ],
  ['Cuidá los datos de todos.', 'Ni tuyos ni ajenos: nombres, DNI, legajos, teléfonos.'],
  ['Ayudá a aprender, no a zafar.', 'Explicar sí; hacer trabajos o exámenes por otra persona, no.'],
] as const;

const steps = [
  [
    'Alguien lo reporta',
    'Spam o repetido, insultos o acoso, datos personales, no relacionado con la materia, posiblemente engañoso u otro motivo.',
  ],
  [
    'Moderación lo revisa',
    'Decide si sigue visible o se retira. Con tres reportes de cuentas distintas en 48 horas, o uno por datos personales, se oculta mientras tanto. Solo cuentan los reportes de cuentas con el email verificado y más de 7 días de antigüedad.',
  ],
  [
    'Si se retira, ves la razón',
    'Te llega la razón y la fecha en Mis envíos, donde podés apelar. Los puntos de ese aporte se descuentan, y se devuelven si se restaura.',
  ],
] as const;

const sanctions = [
  ['Advertencia', 'Un aviso, en general junto con el primer retiro. No limita la cuenta.'],
  [
    'Silenciamiento',
    '7 días sin publicar, editar, reportar ni marcar «Me sirvió». Podés leer, descargar y guardar.',
  ],
  [
    'Suspensión',
    '7 días, 30 días o permanente, sin poder ingresar. La confirma un admin. El spam y las cuentas falsas pueden suspenderse de entrada.',
  ],
] as const;

function DoList({ items, title }: { items: string[]; title: 'Sí' | 'No' }) {
  return (
    <div className="rounded-xl border-[1.5px] border-border bg-card p-4">
      <h3 className="text-sm font-extrabold uppercase tracking-[0.15em]">{title}</h3>
      <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  );
}

/** Community rules in force (canvas «Normas», adapted to what exists today). */
export default function NormasPage() {
  return (
    <article className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-10 font-sans sm:py-14">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-link">Ayuda</p>
        <h1 className="mt-2 text-5xl font-extrabold tracking-[-0.05em]">Normas de la comunidad</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Entre estudiantes, con cuidado. DevsProject funciona porque cada persona comparte algo que
          le sirvió a otra. Si dudás, preguntate si lo que publicás ayuda a quien viene detrás.
        </p>
      </header>

      <Section title="Lo principal">
        <ol className="grid gap-3">
          {principles.map(([title, detail], index) => (
            <li className="flex gap-3" key={title}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full border-[1.5px] border-foreground font-extrabold">
                {index + 1}
              </span>
              <p>
                <strong>{title}</strong> {detail}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Materiales">
        <div className="grid gap-3 sm:grid-cols-2">
          <DoList
            items={[
              'Parciales, finales y recuperatorios, resueltos o no.',
              'Apuntes, resúmenes y guías que hiciste vos.',
              'Trabajos prácticos ya corregidos y devueltos.',
            ]}
            title="Sí"
          />
          <DoList
            items={[
              'Nombres, DNI, legajos o firmas a la vista: tapalos antes de subir.',
              'Libros o apuntes de otras personas completos, sin su permiso.',
              'Enunciados de un examen que todavía se está tomando.',
            ]}
            title="No"
          />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Se publica al instante. Que esté publicado no significa que esté bien resuelto. Si alguien
          lo reporta, moderación lo revisa.
        </p>
      </Section>

      <Section title="Reseñas y experiencias">
        <div className="grid gap-3 sm:grid-cols-2">
          <DoList
            items={[
              'Contar cómo fue la cursada o el final: ritmo, parciales, qué te sirvió.',
              'Mencionar a quien da la materia para dar contexto.',
              'Criticar cómo se dictó una materia, con argumentos.',
            ]}
            title="Sí"
          />
          <DoList
            items={[
              'Insultos, burlas o acusaciones contra docentes o compañeros.',
              'Nombres de compañeros o datos personales.',
              'Inventar o exagerar para perjudicar a alguien.',
            ]}
            title="No"
          />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Se publica al instante. Podés publicar como anónimo: se muestra «Anónimo» y no aparece en
          tu perfil. Moderación puede saber quién la escribió solo dejando registrado el motivo.
        </p>
      </Section>

      <Section title="Convivencia">
        <p className="leading-relaxed">
          No se aceptan insultos, acoso, discriminación, spam ni contenido repetido. Tampoco se
          permite usar varias cuentas para sumar «Me sirvió» o puntos.
        </p>
      </Section>

      <Section title="Si algo no cumple">
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map(([title, detail]) => (
            <li className="rounded-xl border-[1.5px] border-border bg-card p-4" key={title}>
              <h3 className="font-extrabold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ol>
        <p>
          <Link
            className="font-bold text-link underline-offset-4 hover:underline"
            href="/profile/me#mis-envios"
          >
            Ver mis envíos
          </Link>
        </p>
      </Section>

      <Section title="Sanciones">
        <p className="leading-relaxed">
          Si alguien incumple las normas varias veces, moderación puede sancionar su cuenta. El
          sistema sugiere el paso según los retiros de los últimos 90 días, pero una sanción nunca
          se aplica sola: siempre la decide una persona y lleva su razón.
        </p>
        <ol className="grid gap-3 sm:grid-cols-3">
          {sanctions.map(([title, detail]) => (
            <li className="rounded-xl border-[1.5px] border-border bg-card p-4" key={title}>
              <h3 className="font-extrabold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Mientras dura una sanción la ves arriba de cada página, con la razón y hasta cuándo. Un
          retiro que se restaura o se anula por apelación deja de contar.
        </p>
      </Section>

      <Section title="Apelaciones">
        <p className="leading-relaxed">
          Podés apelar un retiro o una sanción una vez, dentro de los 14 días, desde Mis envíos (o
          desde la pantalla de ingreso, si tu cuenta está suspendida). La revisa otra persona de
          moderación, nunca quien decidió, y su respuesta es final: siempre lleva una razón. Si la
          acepta, el contenido vuelve con sus puntos o la sanción se levanta.
        </p>
      </Section>
    </article>
  );
}
