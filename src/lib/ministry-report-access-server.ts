import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { isGroupAdmin, isGroupMember } from "@/lib/group-admin-utils";
import { CALENDAR_GROUP_TABS } from "@/lib/church-groups";
import { getGroups } from "@/lib/group-server";
import {
  getReportTemplateForGroup,
  isReportableMinistryGroup,
  type MinistryLeaderReport,
} from "@/lib/ministry-report-types";

export async function isPastorsGroupMember(userId: string) {
  const groups = await getGroups();
  const pastorsGroup = groups.find((group) => group.id === CALENDAR_GROUP_TABS.pastors);
  if (!pastorsGroup) return false;
  return isGroupMember(pastorsGroup, userId);
}

export async function canReviewMinistryReports(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return isPastorsGroupMember(user.id);
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
  const [submitAllowed, reviewAllowed, leaderGroups] = await Promise.all([
    canSubmitMinistryReports(user),
    canReviewMinistryReports(user),
    user ? getLeaderMinistryGroups(user.id) : Promise.resolve([]),
  ]);

  return {
    canSubmitMinistryReports: submitAllowed,
    canReviewMinistryReports: reviewAllowed,
    leaderMinistryGroups: leaderGroups.map((group) => ({
      id: group.id,
      name: group.name,
      templateKey: group.template.key,
    })),
  };
}
