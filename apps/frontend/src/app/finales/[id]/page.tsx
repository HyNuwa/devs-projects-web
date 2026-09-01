import type { Metadata } from 'next';

import { ExamExperienceDetailRoute } from '@/components/community/CommunityDetailPage';

export const metadata: Metadata = {
  title: 'Experiencia de final - DevsProject',
  description: 'Leé una experiencia de final compartida por la comunidad.',
};

export default function ExamExperienceDetailPage() {
  return <ExamExperienceDetailRoute />;
}
