import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cómo funcionan los puntos - DevsProject',
  description: 'Qué suma puntos en DevsProject, qué no y qué desbloquea cada nivel.',
};

const earns = [
  ['Material publicado', '+10', 'Uno por material.'],
  ['Reseña de cursada con nombre', '+5', 'Suma la primera de cada materia y ciclo lectivo.'],
  ['Experiencia de final con nombre', '+5', 'Suma la primera de cada materia, mesa y año.'],
  [
    '«Me sirvió» en tu material',
    '+1',
    'Hasta 25 por material y 20 por día. Una misma persona te suma como mucho 5 por mes.',
  ],
  [
    'Primera huella',
    '+5',
    'Tu material es el primero de su tipo en la materia y llega a 3 «Me sirvió». No cuenta el tipo «Otro».',
  ],
  [
    'Reporte confirmado',
    '+2',
    'Moderación retiró algo que reportaste. Hasta 10 puntos por semana.',
  ],
  [
    'Corrección aceptada',
    '+2',
    'Aceptaron tu corrección del tipo, la materia, el ciclo o el profesor de un material. Hasta 10 puntos por semana.',
  ],
] as const;

const levels = [
  ['Primeros pasos', 0],
  ['Bigotes curiosos', 30],
  ['De pasillo en pasillo', 100],
  ['Mochila cargada', 250],
  ['Siete vidas', 500],
  ['Apuntes de oro', 900],
  ['Biblioteca viva', 1500],
  ['Faro de la carrera', 2300],
  ['Memoria de la facultad', 3300],
  ['Leyenda de la facultad', 4500],
] as const;

const thousands = new Intl.NumberFormat('es-AR');

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  const id = `puntos-${title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 className="text-2xl font-extrabold tracking-[-0.03em]" id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** How points work (canvas «Ayuda · Cómo funcionan los puntos», README_PUNTOS_E_INSIGNIAS). */
export default function PuntosPage() {
  return (
    <article className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-10 font-sans sm:py-14">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-link">Ayuda</p>
        <h1 className="mt-2 text-5xl font-extrabold tracking-[-0.05em]">
          Cómo funcionan los puntos
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Los puntos reconocen a quien ayuda a otros estudiantes. Lo que más cuenta es que a otros
          les sirva lo que compartiste. No se gastan y no cambian el orden en que aparecen tus
          aportes.
        </p>
      </header>

      <Section title="Qué suma">
        <table aria-label="Qué suma" className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-[1.5px] border-foreground">
              <th className="py-2 pr-3 font-extrabold" scope="col">
                Acción
              </th>
              <th className="py-2 pr-3 font-extrabold" scope="col">
                Puntos
              </th>
              <th className="py-2 font-extrabold" scope="col">
                Límite
              </th>
            </tr>
          </thead>
          <tbody>
            {earns.map(([action, points, limit]) => (
              <tr className="border-b border-line align-top" key={action}>
                <th className="py-2.5 pr-3 font-bold" scope="row">
                  {action}
                </th>
                <td className="py-2.5 pr-3 font-extrabold tabular-nums text-success-ink">
                  {points}
                </td>
                <td className="py-2.5 text-muted-foreground">{limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <strong>Las publicaciones anónimas no suman puntos.</strong> Si sumaran, tu nivel
          cambiaría justo cuando aparece la reseña y eso permitiría adivinar quién la escribió. El
          anonimato se elige al publicar y no cambia al editar.
        </p>
      </Section>

      <Section title="Qué no suma">
        <p>
          Lo que está en revisión previa (hasta que se publica), marcar «Me sirvió» en aportes
          ajenos, entrar todos los días y moderar.
        </p>
      </Section>

      <Section title="Qué «Me sirvió» cuentan">
        <ul className="grid list-disc gap-1.5 pl-5">
          <li>Lo marca una cuenta con email verificado y sin sanciones.</li>
          <li>No es tu propio «Me sirvió».</li>
          <li>El material sigue publicado.</li>
        </ul>
      </Section>

      <Section title="Si se retira o se borra">
        <p>
          Si moderación retira un aporte tuyo, o lo borrás vos, se descuentan los puntos que te dio,
          incluidos sus «Me sirvió». Si después se restaura (por ejemplo, porque ganaste una
          apelación), los recuperás. En pantalla nunca bajás de 0 puntos. Mientras una cuenta está
          silenciada o suspendida, no suma, y lo que no sumó no se recupera después.
        </p>
      </Section>

      <Section title="Privilegios de confianza">
        <p>
          Algunos permisos llegan con tu nivel y tu buen criterio. Todos requieren{' '}
          <strong>90 días sin sanciones</strong>: cuentan los silenciamientos, las suspensiones y
          los retiros por normas, y no las advertencias ni lo que se anuló en una apelación.
        </p>
        <ul className="grid list-disc gap-1.5 pl-5">
          <li>
            <strong>Sugerir correcciones</strong> (desde el Nv. 3): proponé el tipo, la materia, el
            ciclo o el profesor correcto de un material ajeno. Primero decide quien lo subió; si no
            responde en 7 días, moderación. Con 10 correcciones aceptadas ganás la insignia Lupa.
          </li>
          <li>
            <strong>Reportes prioritarios</strong>: con al menos 5 reportes confirmados y un 70 % de
            acierto en los últimos 90 días, tus reportes se revisan antes.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Su estado está en{' '}
          <Link className="font-bold text-link" href="/mi-espacio/progreso">
            Tu progreso
          </Link>
          .
        </p>
      </Section>

      <Section title="Niveles">
        <p className="text-muted-foreground">
          Cada nivel va a desbloquear formas de personalizar tu perfil. Lo vas a ver en{' '}
          <Link className="font-bold text-link" href="/mi-espacio/progreso">
            Tu progreso
          </Link>
          .
        </p>
        <ol aria-label="Niveles" className="grid gap-2 sm:grid-cols-2">
          {levels.map(([name, threshold], index) => (
            <li
              className="flex items-baseline justify-between gap-3 border-b border-line py-1.5"
              key={name}
            >
              <span>
                <span className="font-extrabold">Nv. {index + 1}</span> · {name}
              </span>
              <span className="text-sm font-bold tabular-nums text-muted-foreground">
                {thousands.format(threshold)} pts
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}
