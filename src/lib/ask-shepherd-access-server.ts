import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroups } from "@/lib/group-server";
import { isGroupLeaderOrAssistant, isGroupMember } from "@/lib/group-admin-utils";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import { prisma } from "@/lib/db";
import type { AskShepherdDepartmentDef } from "@/lib/ask-shepherd-departments";
import { ASK_SHEPHERD_DEPARTMENT_MAP } from "@/lib/ask-shepherd-departments";
import { isAskShepherdEnabledServer, isAskShepherdUiPublicEnabled } from "@/lib/ask-shepherd-feature";
import { useDatabase } from "@/lib/use-database";
import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";

export type AskShepherdAccess = {
  canUseAskShepherd: boolean;
  department: AskShepherdDepartmentDef;
  /** Why access was granted (for audits / debugging). */
  accessReason: "pastoral_oversight" | "worship_leader_or_assistant" | "explicit_grant";
  isPastoralOversight: boolean;
};

export type AskShepherdAccessSyncInput = {
  userId: string;
  department: AskShepherdDepartmentDef;
  seniorPastorUserId: string | null;
  associatePastorUserId: string | null;
  worshipGroup: {
    memberIds: string[];
    adminIds: string[];
    assistantAdminIds?: string[];
  } | null;
  explicitGrantActive: boolean;
};

/** Pure helper — used by tests without DB. */
export function computeAskShepherdAccessSync(input: AskShepherdAccessSyncInput): AskShepherdAccess | null {
  const { userId, department, seniorPastorUserId, associatePastorUserId } = input;
  const isPastoral = seniorPastorUserId === userId || associatePastorUserId === userId;
  if (isPastoral) {
    return {
      canUseAskShepherd: true,
      department,
      accessReason: "pastoral_oversight",
      isPastoralOversight: true,
    };
  }

  const g = input.worshipGroup;
  if (g && isGroupMember(g, userId) && isGroupLeaderOrAssistant(g, userId)) {
    return {
      canUseAskShepherd: true,
      department,
      accessReason: "worship_leader_or_assistant",
      isPastoralOversight: false,
    };
  }

  if (input.explicitGrantActive) {
    return {
      canUseAskShepherd: true,
      department,
      accessReason: "explicit_grant",
      isPastoralOversight: false,
    };
  }

  return null;
}

async function getWorshipGroupSnapshot() {
  const groupId = getConfiguredWorshipGroupId();
  const groups = await getGroups();
  return groups.find((g) => g.id === groupId) ?? null;
}

async function hasActiveExplicitGrant(userId: string, departmentKey: string) {
  if (!useDatabase()) return false;
  const row = await prisma.askShepherdAccessGrant.findFirst({
    where: { userId, departmentKey, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return Boolean(row);
}

/**
 * Resolve Ask Shepherd access for Phase 1 (worship only).
 * Denies site admins unless they are pastoral or worship leader/assistant or hold an explicit grant.
 */
export async function resolveAskShepherdAccess(
  user: Pick<PublicMember, "id"> | null,
  department: AskShepherdDepartmentDef,
): Promise<AskShepherdAccess | null> {
  if (!user) return null;

  const assignments = await getPastoralRoleAssignments();
  const worshipGroup = await getWorshipGroupSnapshot();
  const explicit = await hasActiveExplicitGrant(user.id, department.key);

  return computeAskShepherdAccessSync({
    userId: user.id,
    department,
    seniorPastorUserId: assignments.seniorPastorUserId,
    associatePastorUserId: assignments.associatePastorUserId,
    worshipGroup: worshipGroup
      ? {
          memberIds: worshipGroup.memberIds,
          adminIds: worshipGroup.adminIds,
          assistantAdminIds: worshipGroup.assistantAdminIds,
        }
      : null,
    explicitGrantActive: explicit,
  });
}

/** Block generic admins from using Ask Shepherd APIs (per product spec). Pastors and grants still allowed. */
export async function assertNotAdminBypassingAskShepherd(user: Pick<PublicMember, "id"> | null) {
  if (!user) return;
  const access = await resolveAskShepherdAccess(user, ASK_SHEPHERD_DEPARTMENT_MAP.worship);
  if (access) return;
  if (await canManageAsAdmin(user)) {
    throw new Error("Site administrators cannot use Ask Shepherd unless assigned pastoral or worship leadership.");
  }
}

export async function getAskShepherdNavPermission(user: PublicMember | null): Promise<boolean> {
  if (!user) return false;
  if (!isAskShepherdEnabledServer() || !isAskShepherdUiPublicEnabled()) {
    return false;
  }
  const def = ASK_SHEPHERD_DEPARTMENT_MAP.worship;
  const access = await resolveAskShepherdAccess(user, def);
  return Boolean(access?.canUseAskShepherd);
}

export async function getAskShepherdSessionPermission(user: PublicMember | null) {
  return {
    canAccessAskShepherd: await getAskShepherdNavPermission(user),
  };
}
