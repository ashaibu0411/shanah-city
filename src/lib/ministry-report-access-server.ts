import type { PublicMember } from "@/lib/auth-types";
import { isGroupAdmin } from "@/lib/group-admin-utils";
import { getGroups } from "@/lib/group-server";
import { getMinistryManagementPermissions } from "@/lib/ministry-management-access-server";
import {
  getReportTemplateForGroup,
  isReportableMinistryGroup,
  type MinistryLeaderReport,
} from "@/lib/ministry-report-types";

export { canManageMinistry } from "@/lib/ministry-management-access-server";

export async function canReviewMinistryReports(user: Pick<PublicMember, "id"> | null) {
  const permissions = await getMinistryManagementPermissions(user);
  return permissions.canReviewMinistryReports;
}

export async function getLeaderMinistryGroups(userId: string) {
  const groups = await getGroups();
  return groups
    .filter((group) => isGroupAdmin(group, userId) && isReportableMinistryGroup(group))
    .map((group) => ({
      id: group.id,
      name: group.name,
      template: getReportTemplateForGroup(group),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function canSubmitMinistryReports(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  const groups = await getLeaderMinistryGroups(user.id);
  return groups.length > 0;
}

export async function assertCanSubmitForGroup(userId: string, groupId: string) {
  const groups = await getLeaderMinistryGroups(userId);
  const match = groups.find((group) => group.id === groupId);
  if (!match) {
    throw new Error("Only ministry leaders can submit reports for their team.");
  }
  return match;
}

export async function assertCanAccessReport(
  user: Pick<PublicMember, "id">,
  report: MinistryLeaderReport,
) {
  if (await canReviewMinistryReports(user)) {
    return;
  }
  await assertCanSubmitForGroup(user.id, report.groupId);
}

export async function getMinistryReportPermissions(user: Pick<PublicMember, "id"> | null) {
  const [management, leaderGroups] = await Promise.all([
    getMinistryManagementPermissions(user),
    user ? getLeaderMinistryGroups(user.id) : Promise.resolve([]),
  ]);

  return {
    canSubmitMinistryReports: leaderGroups.length > 0,
    canManageMinistry: management.canManageMinistry,
    canReviewMinistryReports: management.canReviewMinistryReports,
    leaderMinistryGroups: leaderGroups.map((group) => ({
      id: group.id,
      name: group.name,
      templateKey: group.template.key,
    })),
  };
}
