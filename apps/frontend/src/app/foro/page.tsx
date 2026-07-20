import type { Metadata } from 'next';
import { CategoryList } from '@/components/foro/CategoryList';

export const metadata: Metadata = {
  title: 'Foro - DevsProject',
  description: 'Explora las categorías del foro de DevsProject',
};

export default function ForoPage() {
  return (
    <div style={{ padding: '2rem', minHeight: 'calc(100vh - 80px)', marginTop: '80px' }}>
      <CategoryList />
    </div>
  );
}
