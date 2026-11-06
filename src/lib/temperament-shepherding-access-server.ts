import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroups } from "@/lib/group-server";
import { isGroupLeaderOrAssistant } from "@/lib/group-admin-utils";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import { getDepartmentDef, type TemperamentDepartmentKey } from "@/lib/temperament-shepherding-departments";
import { temperamentShepherdingPilotUiEnabled } from "@/lib/temperament-shepherding-feature";
import {
  getConfiguredWorshipGroupId,
  userIsInWorshipGroup,
} from "@/lib/worship-access-server";

export type TemperamentShepherdingAccess = {
  canUseHub: boolean;
  /** Member or leader — anyone in the worship group with hub access */
  canCompleteMemberAssessment: boolean;
  canCompleteLeaderAssessment: boolean;
  /** Worship leader/assistant or Senior Pastor (oversight) */
  canOpenLeaderDashboard: boolean;
  /** Senior Pastor role assignment */
  isSeniorPastor: boolean;
  /** Senior or Associate Pastor (pastoral oversight of hub) */
  hasPastoralOversight: boolean;
  /** Assignable ministry leader for worship (group leader/assistant) */
  isWorshipDepartmentLeader: boolean;
};

export async function getTemperamentShepherdingDepartmentAccess(
  user: Pick<PublicMember, "id"> | null,
  departmentKey: TemperamentDepartmentKey,
): Promise<TemperamentShepherdingAccess | null> {
  const def = getDepartmentDef(departmentKey);
  if (!def?.pilotEnabled) {
    return null;
  }

  if (!user) {
    return {
      canUseHub: false,
      canCompleteMemberAssessment: false,
      canCompleteLeaderAssessment: false,
      canOpenLeaderDashboard: false,
      isSeniorPastor: false,
      hasPastoralOversight: false,
      isWorshipDepartmentLeader: false,
    };
  }

  const assignments = await getPastoralRoleAssignments();
  const isSeniorPastor = assignments.seniorPastorUserId === user.id;
  const isAssociatePastor = assignments.associatePastorUserId === user.id;
  const hasPastoralOversight = isSeniorPastor || isAssociatePastor;

  if (departmentKey === "worship") {
    const inWorship = await userIsInWorshipGroup(user.id);
    const worshipLeader = await isWorshipGroupLeaderOrAssistant(user.id);
    const canUseHub = inWorship || hasPastoralOversight;
    const canLeadInPilot = worshipLeader || hasPastoralOversight;
    return {
      canUseHub,
      canCompleteMemberAssessment: canUseHub,
      canCompleteLeaderAssessment: canLeadInPilot,
      canOpenLeaderDashboard: canLeadInPilot,
      isSeniorPastor,
      hasPastoralOversight,
      isWorshipDepartmentLeader: worshipLeader,
    };
  }

  return null;
}

async function isWorshipGroupLeaderOrAssistant(userId: string) {
  const groupId = getConfiguredWorshipGroupId();
  const groups = await getGroups();
  const group = groups.find((g) => g.id === groupId);
  return group ? isGroupLeaderOrAssistant(group, userId) : false;
}

/** True if user leads any group other than worship (cross-department isolation tests). */
export async function userIsNonWorshipGroupLeader(userId: string) {
  const worshipId = getConfiguredWorshipGroupId();
  const groups = await getGroups();
  for (const g of groups) {
    if (g.id === worshipId) continue;
    if (isGroupLeaderOrAssistant(g, userId)) return true;
  }
  return false;
}

async function hasPastoralOversightForTemperament(userId: string) {
  const assignments = await getPastoralRoleAssignments();
  return assignments.seniorPastorUserId === userId || assignments.associatePastorUserId === userId;
}

/** Block admins from using hub APIs to access member reflections, except pastoral roles. */
export async function assertNotAdminPeekingAtTemperament(user: Pick<PublicMember, "id"> | null) {
  if (!user) return;
  if (await hasPastoralOversightForTemperament(user.id)) return;
  if (await canManageAsAdmin(user)) {
    throw new Error("Site administrators cannot access private temperament responses here.");
  }
}

export async function getTemperamentShepherdingHubNav(user: PublicMember | null) {
  if (!temperamentShepherdingPilotUiEnabled()) return false;
  if (!user) return false;
  const access = await getTemperamentShepherdingDepartmentAccess(user, "worship");
  return Boolean(access?.canUseHub);
}

export async function getTemperamentShepherdingHubPermissions(user: PublicMember | null) {
  return {
    canAccessTemperamentShepherdingHub: await getTemperamentShepherdingHubNav(user),
  };
}
