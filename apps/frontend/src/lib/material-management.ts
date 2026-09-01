import type { User } from '@/types/auth';

const moderatorRoles = new Set(['ADMIN', 'MODERATOR', 'SUPERADMIN']);

export type MaterialManagementTarget = {
  authorId: string;
};

export type MaterialManagementCapabilities = {
  canDelete: boolean;
  canEdit: boolean;
  canManage: boolean;
};

/** Mirrors the existing material API: owner edits, owner or moderator deletes. */
export function getMaterialManagementCapabilities(
  material: MaterialManagementTarget | null,
  user: User | null,
): MaterialManagementCapabilities {
  const isOwner = Boolean(material && user && material.authorId === user.id);
  const isModerator = Boolean(user && moderatorRoles.has(user.role));
  const canDelete = isOwner || isModerator;

  return {
    canDelete,
    canEdit: isOwner,
    canManage: isOwner || isModerator,
  };
}
