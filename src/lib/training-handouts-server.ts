import type { PublicMember } from "@/lib/auth-types";
import { ADMIN_GROUP_ID } from "@/lib/church-groups";
import { isGroupAdmin, isGroupAssistantLeader } from "@/lib/group-admin-utils";
import { getGroups } from "@/lib/group-server";
import { getSessionPermissions } from "@/lib/session-permissions";
import {
  getTrainingHandoutBySlug,
  TRAINING_HANDOUTS,
  type TrainingHandout,
  type TrainingHandoutSlug,
} from "@/lib/training-handouts";

type PermissionFlags = Awaited<ReturnType<typeof getSessionPermissions>>;

type LeadershipContext = {
  isGroupAdminAnywhere: boolean;
  isAssistantAnywhere: boolean;
  leadsChoirTeam: boolean;
  leadsNonAdminMinistryGroup: boolean;
};

async function getLeadershipContext(userId: string): Promise<LeadershipContext> {
  const groups = await getGroups();
  let isGroupAdminAnywhere = false;
  let isAssistantAnywhere = false;
  let leadsChoirTeam = false;
  let leadsNonAdminMinistryGroup = false;

  for (const group of groups) {
    if (isGroupAdmin(group, userId)) {
      isGroupAdminAnywhere = true;
      if (group.category === "choir" || group.id === "group-choir") {
        leadsChoirTeam = true;
      }
      if (group.id !== ADMIN_GROUP_ID) {
        leadsNonAdminMinistryGroup = true;
      }
    }
    if (isGroupAssistantLeader(group, userId)) {
      isAssistantAnywhere = true;
    }
  }

  return {
    isGroupAdminAnywhere,
    isAssistantAnywhere,
    leadsChoirTeam,
    leadsNonAdminMinistryGroup,
  };
}

function hasAnyMinistryToolAccess(permissions: PermissionFlags) {
  return (
    permissions.canManageAdmin ||
    permissions.canAccessFinance ||
    permissions.canAccessWorshipPlanner ||
    permissions.canAccessKidsMinistry ||
    permissions.canManageKidsMinistry ||
    permissions.canAccessFrontLiners ||
    permissions.canManageFrontLiners ||
    permissions.canAccessFollowUp ||
    permissions.canManageFollowUp ||
    permissions.canUploadGallery ||
    permissions.canWriteDevotions ||
    permissions.canReviewMinistryReports ||
    permissions.canSubmitMinistryReports
  );
}

function slugMatches(
  slug: TrainingHandoutSlug,
  permissions: PermissionFlags,
  leadership: LeadershipContext,
): boolean {
  switch (slug) {
    case "choir-worship-leader":
      return permissions.canAccessWorshipPlanner || leadership.leadsChoirTeam;
    case "finance-team":
      return permissions.canAccessFinance;
    case "comms-team":
      return permissions.canManageAdmin;
    case "kids-ministry-leader":
      return permissions.canAccessKidsMinistry || permissions.canManageKidsMinistry;
    case "frontliners-ushering":
      return permissions.canAccessFrontLiners || permissions.canManageFrontLiners;
    case "follow-up-guest-care":
      return permissions.canAccessFollowUp || permissions.canManageFollowUp;
    case "media-team":
      return permissions.canUploadGallery;
    case "devotion-writers":
      return permissions.canWriteDevotions;
    case "senior-associate-pastor":
      return permissions.canReviewMinistryReports;
    case "admin-group":
      return permissions.canManageAdmin;
    case "ministry-group-leader":
      return permissions.canSubmitMinistryReports || leadership.leadsNonAdminMinistryGroup;
    case "assistant-group-leader":
      return leadership.isAssistantAnywhere;
    case "member-quick-reference":
      return (
        leadership.isGroupAdminAnywhere ||
        leadership.isAssistantAnywhere ||
        hasAnyMinistryToolAccess(permissions)
      );
    default:
      return false;
  }
}

export async function getTrainingHandoutsForUser(
  user: PublicMember,
): Promise<TrainingHandout[]> {
  const [permissions, leadership] = await Promise.all([
    getSessionPermissions(user),
    getLeadershipContext(user.id),
  ]);

  return TRAINING_HANDOUTS.filter((handout) =>
    slugMatches(handout.slug, permissions, leadership),
  );
}

export async function userCanAccessTrainingHandout(
  user: PublicMember | null,
  slug: string,
) {
  if (!user) return false;
  const handout = getTrainingHandoutBySlug(slug);
  if (!handout) return false;
  const allowed = await getTrainingHandoutsForUser(user);
  return allowed.some((entry) => entry.slug === handout.slug);
}
