import type { User } from '@/types/auth';

export type MaterialManagementTarget = {
  authorId: string;
};

export type MaterialManagementCapabilities = {
  canDelete: boolean;
  canEdit: boolean;
  canManage: boolean;
};

/**
 * Mirrors the material API: only the author edits or deletes. Staff take
 * content down with a retiro from its caso, which follows their facultades and
 * stays in the history.
 */
export function getMaterialManagementCapabilities(
  material: MaterialManagementTarget | null,
  user: User | null,
): MaterialManagementCapabilities {
  const isOwner = Boolean(material && user && material.authorId === user.id);

  return {
    canDelete: isOwner,
    canEdit: isOwner,
    canManage: isOwner,
  };
}
