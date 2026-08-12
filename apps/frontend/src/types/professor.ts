export interface ProfessorUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ProfessorSubject {
  id: string;
  subjectId: string;
  professorId: string;
  subject: { id: string; name: string; code: string | null };
}

export interface Professor {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  subjects?: ProfessorSubject[];
}
