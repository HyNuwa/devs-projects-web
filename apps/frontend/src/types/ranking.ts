export interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  points: number;
  level: number;
}

export interface LeaderboardResponse {
  data: LeaderboardUser[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  period?: 'global' | 'weekly' | 'monthly';
}

export interface UserRank {
  rank: number;
  totalUsers: number;
  points: number;
  level: number;
}

export interface LevelInfo {
  level: number;
  levelName: string;
  points: number;
  pointsToNext: number | null;
  nextLevel: number | null;
  nextLevelName: string | null;
}

export interface RpgLevel {
  level: number;
  name: string;
  points: number;
}
