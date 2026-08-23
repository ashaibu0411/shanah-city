import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import {
  getConfiguredMediaGroupId,
  isMediaGroup,
  isUserInGroup,
} from "@/lib/media-group";

export async function userIsInMediaGroup(userId: string) {
  const configuredId = getConfiguredMediaGroupId();
  if (configuredId) {
    const detail = await getGroupDetail(configuredId, userId);
    if (!detail) {
      return false;
    }
    return detail.isMember || detail.isAdmin;
  }

  const groups = await getGroups();
  return groups.some((group) => isMediaGroup(group) && isUserInGroup(group, userId));
}

export async function canUploadGallery(
  user: Pick<PublicMember, "id" | "role"> | null,
) {
  if (!user) {
    return false;
  }
  if (await canManageAsAdmin(user)) {
    return true;
  }
  return userIsInMediaGroup(user.id);
}

export async function canManageGallery(user: Pick<PublicMember, "id" | "role"> | null) {
  return canUploadGallery(user);
}

export async function canViewGalleryDownloadLog(
  user: Pick<PublicMember, "id" | "role"> | null,
) {
  return canManageGallery(user);
}

export async function getGalleryUploadPermissions(
  user: Pick<PublicMember, "id" | "role"> | null,
) {
  return { canUploadGallery: await canUploadGallery(user) };
}
