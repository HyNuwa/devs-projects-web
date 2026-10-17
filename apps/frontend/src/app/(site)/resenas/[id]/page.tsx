import type { Metadata } from 'next';

import { CourseReviewDetailRoute } from '@/components/community/CommunityDetailPage';

export const metadata: Metadata = {
  title: 'Reseña de cursada - DevsProject',
  description: 'Leé una experiencia de cursada compartida por la comunidad.',
};

export default function CourseReviewDetailPage() {
  return <CourseReviewDetailRoute />;
}
