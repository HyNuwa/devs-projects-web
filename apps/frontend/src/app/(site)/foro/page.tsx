import type { Metadata } from 'next';
import { CategoryList } from '@/components/foro/CategoryList';

export const metadata: Metadata = {
  title: 'Foro - DevsProject',
  description: 'Explora las categorías del foro de DevsProject',
};

export default function ForoPage() {
  return (
    <div style={{ padding: '2rem', minHeight: 'calc(100dvh - 4.5rem)' }}>
      <CategoryList />
    </div>
  );
}
