import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThreadView } from '@/components/foro/ThreadView';

// Mock data
const mockThread = {
  id: '1',
  title: '¿Cuáles son las mejores prácticas para estructurar un proyecto en React?',
  author: 'CodeWizard',
  authorRole: 'Moderador',
  createdAt: 'Hace 2 horas',
  votes: 45,
  content: `
    <p>Hola comunidad,</p>
    <p>Estoy empezando un nuevo proyecto grande en React y me gustaría saber cuáles son las mejores prácticas actuales para estructurar las carpetas y archivos.</p>
    <p>He visto que algunos usan <code>features/</code> y otros agrupan por <code>components/</code>, <code>hooks/</code>, etc.</p>
    <pre><code>src/
  components/
  hooks/
  pages/
  utils/</code></pre>
    <p>¿Qué opinan ustedes? ¿Qué les ha funcionado mejor en proyectos escalables?</p>
  `,
  tags: ['React', 'Arquitectura', 'Frontend'],
  isResolved: true,
  replies: [
    {
      id: 'r1',
      author: 'LoreMaster',
      authorRole: 'Veterano',
      createdAt: 'Hace 1 hora',
      votes: 23,
      isAcceptedAnswer: true,
      content: `
        <p>¡Hola! Para proyectos grandes, la arquitectura basada en <strong>features</strong> suele escalar mucho mejor.</p>
        <p>En lugar de tener todos los componentes mezclados, los agrupas por dominio o característica de la aplicación. Por ejemplo:</p>
        <pre><code>src/
  features/
    auth/
      components/
      hooks/
      api/
    foro/
      components/
      hooks/</code></pre>
        <p>Esto hace que sea mucho más fácil encontrar todo lo relacionado con una funcionalidad específica.</p>
      `,
    },
    {
      id: 'r2',
      author: 'PixelMage',
      createdAt: 'Hace 30 minutos',
      votes: 5,
      content: `
        <p>Totalmente de acuerdo con LoreMaster. Además, te recomiendo usar <strong>Next.js App Router</strong> si estás empezando un proyecto nuevo, ya que te obliga a estructurar las rutas de una forma muy limpia.</p>
        <p>No olvides mantener tus componentes compartidos (UI Kit) en una carpeta separada como <code>src/components/ui/</code>.</p>
      `,
    },
  ],
};

export const metadata: Metadata = {
  title: 'Hilo - DevsProject',
  description: 'Viendo hilo del foro',
};

export default async function HiloPage({
  params,
}: {
  params: Promise<{ categoria: string; hilo: string }>;
}) {
  const { categoria } = await params;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '80px auto 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href={`/foro/${categoria}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          Volver a la categoría
        </Link>
      </div>

      <ThreadView thread={mockThread} />
    </div>
  );
}
