import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { ThreadList } from '@/components/foro/ThreadList';

// Mock data
const mockThreads = [
  {
    id: '1',
    title: '¿Cuáles son las mejores prácticas para estructurar un proyecto en React?',
    author: 'CodeWizard',
    createdAt: 'Hace 2 horas',
    votes: 45,
    replies: 12,
    views: 340,
    tags: ['React', 'Arquitectura', 'Frontend'],
    isPinned: true,
  },
  {
    id: '2',
    title: 'Problema con useEffect y dependencias infinitas',
    author: 'PixelMage',
    createdAt: 'Hace 5 horas',
    votes: 12,
    replies: 8,
    views: 156,
    tags: ['React', 'Hooks', 'Bugs'],
    isResolved: true,
  },
  {
    id: '3',
    title: 'Comparativa: Next.js App Router vs Pages Router',
    author: 'LoreMaster',
    createdAt: 'Ayer',
    votes: 89,
    replies: 34,
    views: 1205,
    tags: ['Next.js', 'Debate'],
  },
  {
    id: '4',
    title: '¿Cómo manejar el estado global en 2026? Zustand vs Redux',
    author: 'DataHunter',
    createdAt: 'Hace 2 días',
    votes: 156,
    replies: 89,
    views: 2400,
    tags: ['Estado', 'Zustand', 'Redux'],
  },
];

export const metadata: Metadata = {
  title: 'Categoría - DevsProject',
  description: 'Hilos de la categoría',
};

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;

  // Format category name for display
  const categoryName = categoria
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/foro"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          Volver a Categorías
        </Link>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2rem',
                fontFamily: 'var(--font-heading)',
                margin: '0 0 0.5rem 0',
                color: 'var(--color-text-primary)',
              }}
            >
              {categoryName}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Explora y participa en las discusiones de esta categoría.
            </p>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: 'var(--color-primary-500)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <Plus size={18} />
            Nuevo Hilo
          </button>
        </div>
      </div>

      <ThreadList categorySlug={categoria} threads={mockThreads} />
    </div>
  );
}
