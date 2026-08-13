import type { PublicMember } from "@/lib/auth-types";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import {
  getConfiguredDevotionGroupId,
  isDevotionWritersGroup,
  isUserInGroup,
} from "@/lib/devotion-writers-group";

export async function userIsInDevotionWritersGroup(userId: string) {
  const configuredId = getConfiguredDevotionGroupId();
  if (configuredId) {
    const detail = await getGroupDetail(configuredId, userId);
    if (!detail) {
      return false;
    }
    return detail.isMember || detail.isAdmin;
  }

  const groups = await getGroups();
  return groups.some(
    (group) => isDevotionWritersGroup(group) && isUserInGroup(group, userId),
  );
}

export async function canWriteDevotions(
  user: Pick<PublicMember, "id"> | null,
) {
  if (!user) {
    return false;
  }
  return userIsInDevotionWritersGroup(user.id);
}

export async function getDevotionWritePermissions(
  user: Pick<PublicMember, "id"> | null,
) {
  return { canWriteDevotions: await canWriteDevotions(user) };
}
