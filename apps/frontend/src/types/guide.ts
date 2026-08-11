export interface GuideAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface GuideStep {
  id: string;
  guideId: string;
  title: string;
  content: string;
  stepOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  authorId: string;
  title: string;
  description: string | null;
  content: string;
  viewCount: number;
  isPublished: boolean;
  isDeleted: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
  author: GuideAuthor;
  steps?: GuideStep[];
  _count?: { steps: number };
}
