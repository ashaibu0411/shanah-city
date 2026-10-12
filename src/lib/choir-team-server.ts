import { getUserById } from "@/lib/auth-server";
import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getMemberAvatarApiUrl } from "@/lib/avatar-server";
import { getGroupDetail } from "@/lib/group-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import {
  SHANAH_WORSHIP_GROUP_ID,
  choirPlanKey,
} from "@/lib/choir-group-constants";
import type {
  ChoirTeamAssignmentView,
  ChoirTeamMemberView,
  ChoirTeamPagePayload,
  ChoirTeamSectionGroup,
} from "@/lib/choir-team-types";
import { site } from "@/lib/site";
import { listWorshipPlans } from "@/lib/worship-server";
import { canManageWorshipPlan } from "@/lib/worship-access-server";
import {
  combinePlanDateTime,
  serviceDateTimeLabel,
  worshipPartLabel,
  worshipRoleLabel,
  worshipTimeLabel,
  WORSHIP_PART_ROLES,
  type WorshipServicePlan,
  type WorshipTeamMember,
} from "@/lib/worship-types";

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function memberRoleLabel(member: WorshipTeamMember) {
  const base = worshipRoleLabel(member.role);
  if (member.partRole?.trim()) {
    const part = worshipPartLabel(member.partRole);
    if (member.role === "singer") {
      return `Vocals (${part})`;
    }
    return `${base} (${part})`;
  }
  return base;
}

function sectionLabel(member: WorshipTeamMember) {
  if (member.partRole?.trim()) {
    return worshipPartLabel(member.partRole);
  }
  return worshipRoleLabel(member.role);
}

function toAssignment(
  plan: WorshipServicePlan,
  mine: WorshipTeamMember,
  nowMs: number,
): ChoirTeamAssignmentView {
  const startsAtMs = combinePlanDateTime(plan.serviceDate, plan.serviceTime).getTime();
  const isPast = startsAtMs < nowMs - 3_600_000;
  return {
    id: `assignment-${choirPlanKey(plan.serviceDate, plan.serviceTime)}`,
    planKey: choirPlanKey(plan.serviceDate, plan.serviceTime),
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
    title: plan.title?.trim() || "Sunday Service",
    dateTimeLabel: serviceDateTimeLabel(plan.serviceDate, plan.serviceTime),
    timeLabel: worshipTimeLabel(plan.serviceTime) || plan.serviceTime,
    location: site.heroChurchName,
    roleLabel: memberRoleLabel(mine),
    songCount: plan.songs.length,
    status: isPast ? "past" : mine.ready ? "confirmed" : "assigned",
    startsAtMs,
  };
}

async function memberViewFromGroup(
  member: { id: string; name: string; isAdmin: boolean; isAssistantLeader: boolean },
  roleFromPlan: string | null,
): Promise<ChoirTeamMemberView> {
  const profile = await getUserById(member.id);
  const avatarUrl = profile?.avatarUrl
    ? getMemberAvatarApiUrl(member.id, profile.avatarUrl)
    : null;
  let roleLabel = roleFromPlan ?? "Worship team";
  if (member.isAdmin) {
    roleLabel = "Worship leader";
  } else if (member.isAssistantLeader) {
    roleLabel = "Assistant worship leader";
  }
  const sectionLabel =
    roleFromPlan?.includes("Vocals") || roleFromPlan?.includes("(")
      ? roleFromPlan.replace(/^Vocals\s*\(/, "").replace(/\)$/, "")
      : undefined;

  return {
    userId: member.id,
    name: member.name,
    roleLabel,
    sectionLabel: sectionLabel && sectionLabel !== roleLabel ? sectionLabel : undefined,
    avatarUrl,
    isLeadership: member.isAdmin || member.isAssistantLeader,
    profileHref: `/messages?member=${encodeURIComponent(member.id)}&name=${encodeURIComponent(member.name)}`,
  };
}

export type ChoirMemberAssignmentsPayload = {
  upcoming: ChoirTeamAssignmentView[];
  recent: ChoirTeamAssignmentView[];
};

async function assertChoirTeamAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return null;
  }

  const group = await getGroupDetail(groupId, user.id);
  const isSiteAdmin = await canManageAsAdmin(user);
  if (!group?.isMember && !isSiteAdmin) {
    return null;
  }

  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return null;
  }

  return group;
}

function memberAssignmentsFromPlans(user: PublicMember, plans: WorshipServicePlan[]): ChoirMemberAssignmentsPayload {
  const nowMs = Date.now();
  const myAssignments = plans
    .map((plan) => {
      const mine = plan.team.find((member) => member.userId === user.id);
      if (!mine) return null;
      return toAssignment(plan, mine, nowMs);
    })
    .filter((entry): entry is ChoirTeamAssignmentView => entry !== null);

  const upcoming = myAssignments.filter((entry) => entry.startsAtMs >= nowMs - 3_600_000);
  const recent = myAssignments
    .filter((entry) => entry.startsAtMs < nowMs - 3_600_000)
    .sort((a, b) => b.startsAtMs - a.startsAtMs)
    .slice(0, 5);

  return { upcoming, recent };
}

/** Personal assignments only — avoids loading the full roster (used by availability & schedule). */
export async function listChoirMemberAssignments(
  user: PublicMember,
  groupId: string,
): Promise<ChoirMemberAssignmentsPayload | null> {
  if (!(await assertChoirTeamAccess(user, groupId))) {
    return null;
  }

  const since = isoDaysAgo(120);
  const plans = (await listWorshipPlans({ since }))
    .filter((plan) => plan.status === "published")
    .sort(
      (a, b) =>
        combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
        combinePlanDateTime(b.serviceDate, b.serviceTime).getTime(),
    );

  return memberAssignmentsFromPlans(user, plans);
}

function buildSectionGroups(
  members: ChoirTeamMemberView[],
  kind: "vocal" | "instrument",
): ChoirTeamSectionGroup[] {
  const roles = WORSHIP_PART_ROLES.filter((entry) => entry.kind === kind);
  const groups: ChoirTeamSectionGroup[] = [];
  for (const role of roles) {
    const inSection = members.filter((member) => {
      const label = member.sectionLabel?.toLowerCase() ?? "";
      return label === role.label.toLowerCase() || label === role.value;
    });
    if (inSection.length === 0) continue;
    groups.push({ id: role.value, title: role.label, members: inSection });
  }
  return groups;
}

export async function buildChoirTeamPagePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirTeamPagePayload | null> {
  const group = await assertChoirTeamAccess(user, groupId);
  if (!group) {
    return null;
  }

  const canManageWorship = await canManageWorshipPlan(user);
  const canManageRoster = await canManageGroupEvents(user, groupId);
  const since = isoDaysAgo(120);

  const plans = (await listWorshipPlans({ since }))
    .filter((plan) => plan.status === "published")
    .sort(
      (a, b) =>
        combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
        combinePlanDateTime(b.serviceDate, b.serviceTime).getTime(),
    );

  const assignments = memberAssignmentsFromPlans(user, plans);

  const roleByUserId = new Map<string, string>();
  for (const plan of [...plans].reverse()) {
    for (const member of plan.team) {
      if (!roleByUserId.has(member.userId)) {
        roleByUserId.set(member.userId, memberRoleLabel(member));
      }
    }
  }

  const teamMembers: ChoirTeamMemberView[] = [];
  for (const member of group?.members ?? []) {
    teamMembers.push(await memberViewFromGroup(member, roleByUserId.get(member.id) ?? null));
  }

  teamMembers.sort((a, b) => {
    if (a.isLeadership !== b.isLeadership) return a.isLeadership ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const leadership = teamMembers.filter((member) => member.isLeadership);
  const vocalSections = buildSectionGroups(teamMembers, "vocal");
  const instrumentSections = buildSectionGroups(teamMembers, "instrument");

  return {
    upcoming: assignments.upcoming,
    recent: assignments.recent,
    teamPreview: teamMembers.slice(0, 8),
    teamMembers,
    leadership,
    vocalSections,
    instrumentSections,
    canManageRoster,
    canManageWorship,
    groupChatHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?chat=1`,
    manageRosterHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?manage=1&section=members`,
    managePlannerHref: "/worship",
    availabilityHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}/availability`,
  };
}
