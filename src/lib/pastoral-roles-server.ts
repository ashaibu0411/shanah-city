import { getUserById } from "@/lib/auth-server";
import {
  ASSOCIATE_PASTOR_GROUP_ID,
  isDeprecatedPastoralRoleGroup,
  SENIOR_PASTOR_GROUP_ID,
} from "@/lib/church-groups";
import { getGroups } from "@/lib/group-server";
import type {
  PastoralRole,
  PastoralRoleAssignmentView,
  PastoralRoleAssignments,
} from "@/lib/pastoral-roles-types";
import {
  PASTORAL_ROLE_LABELS,
  PASTORAL_ROLES,
  pastoralRoleForUser,
  userIdForPastoralRole,
} from "@/lib/pastoral-roles-types";
import { useDatabase } from "@/lib/use-database";
import * as pastoralRolesDb from "@/lib/stores/pastoral-roles-db";
import * as pastoralRolesJson from "@/lib/stores/pastoral-roles-json";

const store = () => (useDatabase() ? pastoralRolesDb : pastoralRolesJson);

function isEmpty(assignments: PastoralRoleAssignments) {
  return !assignments.seniorPastorUserId && !assignments.associatePastorUserId;
}

async function migrateLegacyGroupAssignments(): Promise<PastoralRoleAssignments | null> {
  const groups = await getGroups();
  const seniorGroup = groups.find((group) => group.id === SENIOR_PASTOR_GROUP_ID);
  const associateGroup = groups.find((group) => group.id === ASSOCIATE_PASTOR_GROUP_ID);
  const seniorPastorUserId = seniorGroup?.memberIds[0] ?? null;
  const associatePastorUserId = associateGroup?.memberIds[0] ?? null;

  if (!seniorPastorUserId && !associatePastorUserId) {
    return null;
  }

  return {
    seniorPastorUserId,
    associatePastorUserId:
      associatePastorUserId && associatePastorUserId !== seniorPastorUserId
        ? associatePastorUserId
        : associateGroup?.memberIds.find((memberId) => memberId !== seniorPastorUserId) ?? null,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    updatedByName: "Legacy group migration",
  };
}

export async function getPastoralRoleAssignments() {
  let assignments = await store().getPastoralRoleAssignments();
  if (isEmpty(assignments)) {
    const migrated = await migrateLegacyGroupAssignments();
    if (migrated) {
      for (const role of PASTORAL_ROLES) {
        const userId = userIdForPastoralRole(role, migrated);
        if (userId) {
          assignments = await store().setPastoralRoleAssignment({
            role,
            userId,
            updatedBy: "system",
            updatedByName: "Legacy group migration",
          });
        }
      }
    }
  }
  return assignments;
}

export async function setPastoralRoleAssignment(input: {
  role: PastoralRole;
  userId: string | null;
  updatedBy: string;
  updatedByName: string;
}) {
  if (input.userId) {
    const user = await getUserById(input.userId);
    if (!user) {
      throw new Error("Choose a valid member.");
    }
  }

  return store().setPastoralRoleAssignment(input);
}

export async function userHasPastoralMinistryRole(userId: string) {
  const assignments = await getPastoralRoleAssignments();
  return pastoralRoleForUser(userId, assignments) !== null;
}

export async function getPastoralRoleAssignmentViews(): Promise<PastoralRoleAssignmentView[]> {
  const assignments = await getPastoralRoleAssignments();
  const views: PastoralRoleAssignmentView[] = [];

  for (const role of PASTORAL_ROLES) {
    const userId = userIdForPastoralRole(role, assignments);
    const user = userId ? await getUserById(userId) : null;
    views.push({
      role,
      label: PASTORAL_ROLE_LABELS[role],
      userId,
      userName: user?.name ?? null,
    });
  }

  return views;
}

export function filterDeprecatedPastoralGroups<
  T extends { id: string; name: string; status?: string },
>(groups: T[]) {
  return groups.filter((group) => !isDeprecatedPastoralRoleGroup(group.id));
}

export async function getPastoralReviewerUserIds() {
  const assignments = await getPastoralRoleAssignments();
  const userIds = new Set<string>();
  if (assignments.seniorPastorUserId) userIds.add(assignments.seniorPastorUserId);
  if (assignments.associatePastorUserId) userIds.add(assignments.associatePastorUserId);
  return [...userIds];
}

export { pastoralRoleForUser };
