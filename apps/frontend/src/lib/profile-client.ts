import { api } from '@/lib/api';

export type ProfileOptionKind = 'cat' | 'accent' | 'background' | 'frame' | 'banner' | 'theme';
export type PinType = 'MATERIAL' | 'COURSE_REVIEW' | 'EXAM_EXPERIENCE';
export type BadgeTier = 'BRONCE' | 'PLATA' | 'ORO';

export type ProfilePin = { type: PinType; id: string };

export type ProfileChoices = {
  avatarCat: string | null;
  accent: string | null;
  background: string | null;
  frame: string | null;
  banner: string | null;
  theme: string | null;
  titleBadge: string | null;
  featuredBadges: string[];
  pinned: ProfilePin[];
  showLevelAndBadges: boolean;
};

export type ProfileOption = {
  id: string;
  kind: ProfileOptionKind;
  label: string;
  unlocked: boolean;
  /** What unlocks it: «Nv. 5» or «Insignia Salvavidas». */
  unlockLabel: string;
};

export type PublicBadge = {
  slug: string;
  name: string;
  rarity: string | null;
  tier: BadgeTier | null;
  edition: number;
};

export type ContributionItem = ProfilePin & {
  title: string;
  subject: { code: string | null; name: string };
  createdAt: string;
  /** Materials only, to open the preview; null for reseñas and experiencias. */
  fileType: string | null;
  academicYear: number | null;
};

/** `GET /users/me/profile-customization`: Mi perfil → «Perfil público». */
export type MyProfileCustomization = {
  choices: ProfileChoices;
  options: ProfileOption[];
  limits: { pins: number; featured: number; titleUnlocked: boolean };
  eligibleBadges: PublicBadge[];
  pinnedItems: ContributionItem[];
};

/** `GET /profiles/:username`: the perfil público, open to anyone. */
export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  /** `YYYY-MM`. */
  memberSince: string;
  avatarUrl: string | null;
  avatarCat: string | null;
  customization: {
    accent: string | null;
    background: string | null;
    frame: string | null;
    banner: string | null;
    theme: string | null;
  };
  /** Null when the student hid their nivel and insignias. */
  level: { number: number; name: string } | null;
  title: PublicBadge | null;
  featured: PublicBadge[];
  badges: PublicBadge[];
  pinned: ContributionItem[];
};

export type ContributionsPage = { items: ContributionItem[]; page: number; hasMore: boolean };

export async function getMyProfileCustomization(): Promise<MyProfileCustomization> {
  const { data } = await api.get<MyProfileCustomization>('/users/me/profile-customization');
  return data;
}

/** Replaces every choice; the API rejects locked or foreign options and changes nothing. */
export async function saveMyProfileCustomization(
  choices: ProfileChoices,
): Promise<MyProfileCustomization> {
  const { data } = await api.put<MyProfileCustomization>(
    '/users/me/profile-customization',
    choices,
  );
  return data;
}

export async function getPublicProfile(username: string): Promise<PublicProfile> {
  const { data } = await api.get<PublicProfile>(`/profiles/${encodeURIComponent(username)}`);
  return data;
}

export async function getProfileContributions(
  username: string,
  page = 1,
): Promise<ContributionsPage> {
  const { data } = await api.get<ContributionsPage>(
    `/profiles/${encodeURIComponent(username)}/contributions`,
    { params: { page } },
  );
  return data;
}
