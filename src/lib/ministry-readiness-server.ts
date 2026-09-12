import { useDatabase } from "@/lib/use-database";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import type { GroupDetail } from "@/lib/group-types";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import {
  isTrainingRequiredCompletion,
  minCorrectToPass,
  passesReadinessQuiz,
  resolveMinistryReadiness,
  scoreReadinessAnswers,
  toPublicReadinessPack,
  type MinistryReadinessKey,
} from "@/lib/ministry-readiness-types";
import * as ministryReadinessDb from "@/lib/stores/ministry-readiness-db";
import * as ministryReadinessJson from "@/lib/stores/ministry-readiness-json";

const store = () => (useDatabase() ? ministryReadinessDb : ministryReadinessJson);

export async function isMemberTrainingRequired(
  userId: string,
  group: { id: string; name: string },
) {
  const pack = resolveMinistryReadiness(group);
  if (!pack) return false;

  const completion = await store().getMinistryReadinessCompletion(userId, pack.readinessKey);
  return isTrainingRequiredCompletion(completion);
}

export async function memberHasFullGroupAccess(userId: string, groupId: string) {
  const group = await getGroupDetail(groupId, userId);
  if (!group?.isMember) {
    return { allowed: false as const, group, trainingRequired: false };
  }

  const trainingRequired = await isMemberTrainingRequired(userId, group);
  if (trainingRequired) {
    return { allowed: false as const, group, trainingRequired: true };
  }

  return { allowed: true as const, group, trainingRequired: false };
}

export async function enrichGroupDetailWithReadiness(
  group: GroupDetail | null,
  viewerId?: string,
): Promise<GroupDetail | null> {
  if (!group) return null;

  const pack = resolveMinistryReadiness(group);
  if (!pack) return group;

  const completions = await Promise.all(
    group.members.map((member) =>
      store().getMinistryReadinessCompletion(member.id, pack.readinessKey),
    ),
  );

  const members = group.members.map((member, index) => ({
    ...member,
    trainingRequired: isTrainingRequiredCompletion(completions[index]),
  }));

  const trainingPending = viewerId
    ? (members.find((member) => member.id === viewerId)?.trainingRequired ?? false)
    : false;

  return {
    ...group,
    members,
    trainingPending,
  };
}

export async function getReadinessStatusForGroup(userId: string, groupId: string) {
  const group = await getGroupDetail(groupId, userId);
  if (!group) return null;

  const pack = resolveMinistryReadiness(group);
  if (!pack) return null;

  const completion = await store().getMinistryReadinessCompletion(userId, pack.readinessKey);

  if (group.isMember) {
    if (!isTrainingRequiredCompletion(completion)) {
      return null;
    }
    return toPublicReadinessPack(pack, completion);
  }

  return toPublicReadinessPack(pack, completion);
}

export async function hasMinistryReadinessAccess(userId: string, readinessKey: MinistryReadinessKey) {
  const completion = await store().getMinistryReadinessCompletion(userId, readinessKey);
  if (!completion) return false;
  return !isTrainingRequiredCompletion(completion);
}

export async function submitMinistryReadiness(input: {
  user: PublicMember;
  groupId: string;
  answers: Record<string, number>;
  agreed: boolean;
}) {
  if (!input.agreed) {
    throw new Error("You must agree to the ministry standards and team commitment before continuing.");
  }

  const group = await getGroupDetail(input.groupId, input.user.id);
  if (!group) {
    throw new Error("Group not found.");
  }

  const pack = resolveMinistryReadiness(group);
  if (!pack) {
    throw new Error("This group does not require readiness training.");
  }

  const existingCompletion = await store().getMinistryReadinessCompletion(
    input.user.id,
    pack.readinessKey,
  );

  if (group.isMember) {
    if (!isTrainingRequiredCompletion(existingCompletion)) {
      throw new Error("You are already a member of this team.");
    }
  }

  for (const question of pack.questions) {
    if (typeof input.answers[question.id] !== "number") {
      throw new Error("Please answer every question.");
    }
  }

  const { correct, total } = scoreReadinessAnswers(pack, input.answers);
  const required = minCorrectToPass(total);
  if (!passesReadinessQuiz(correct, total)) {
    throw new Error(
      `You scored ${correct}/${total}. You need at least ${required} correct — review the standards and try again.`,
    );
  }

  const agreedAt = new Date().toISOString();
  const completion = await store().saveMinistryReadinessCompletion({
    userId: input.user.id,
    readinessKey: pack.readinessKey,
    groupId: group.id,
    groupName: group.name,
    score: correct,
    totalQuestions: total,
    answers: input.answers,
    agreedAt,
    source: "self_join",
  });

  return toPublicReadinessPack(pack, completion);
}

export async function exemptMemberAddedByLeader(input: {
  group: { id: string; name: string };
  memberId: string;
  leaderName: string;
}) {
  const pack = resolveMinistryReadiness(input.group);
  if (!pack) return;

  const agreedAt = new Date().toISOString();
  await store().saveMinistryReadinessCompletion({
    userId: input.memberId,
    readinessKey: pack.readinessKey,
    groupId: input.group.id,
    groupName: input.group.name,
    score: 0,
    totalQuestions: 0,
    answers: {},
    agreedAt,
    source: "leader_added",
  });
}

export async function requireMemberTraining(input: {
  groupId: string;
  memberId: string;
  leaderId: string;
}) {
  const leader = await getUserById(input.leaderId);
  if (!leader) {
    throw new Error("Sign in required.");
  }

  const group = await getGroupDetail(input.groupId, input.leaderId);
  if (!group) {
    throw new Error("Group not found.");
  }

  const isSiteAdmin = await canManageAsAdmin(leader);
  if (!group.isAdmin && !group.isAssistantLeader && !isSiteAdmin) {
    throw new Error("Leader access required.");
  }

  const pack = resolveMinistryReadiness(group);
  if (!pack) {
    throw new Error("This group does not use readiness training.");
  }

  if (!group.members.some((member) => member.id === input.memberId)) {
    throw new Error("That person is not a member of this group.");
  }

  if (input.memberId === input.leaderId) {
    throw new Error("Ask another leader to assign training to you.");
  }

  const agreedAt = new Date().toISOString();
  await store().saveMinistryReadinessCompletion({
    userId: input.memberId,
    readinessKey: pack.readinessKey,
    groupId: group.id,
    groupName: group.name,
    score: 0,
    totalQuestions: 0,
    answers: {},
    agreedAt,
    source: "training_required",
  });

  const member = await getUserById(input.memberId);
  return {
    groupId: group.id,
    memberId: input.memberId,
    memberName: member?.name ?? "Member",
    groupName: group.name,
    packTitle: pack.title,
  };
}

export async function getReadinessJoinPolicy(
  group: { id: string; name: string; requiresApproval?: boolean },
  userId: string,
): Promise<"blocked" | "pending" | "allowed"> {
  const pack = resolveMinistryReadiness(group);
  if (!pack) {
    return group.requiresApproval ? "pending" : "allowed";
  }

  const hasAccess = await hasMinistryReadinessAccess(userId, pack.readinessKey);
  if (!hasAccess) {
    return "blocked";
  }

  if (group.requiresApproval || pack.requiresLeaderApproval) {
    return "pending";
  }

  return "allowed";
}

export async function listGroupReadinessCompletionsForLeaders(groupId: string, reviewerId: string) {
  const reviewer = await getUserById(reviewerId);
  if (!reviewer) {
    throw new Error("Sign in required.");
  }

  const group = await getGroupDetail(groupId, reviewerId);
  if (!group) {
    throw new Error("Group not found.");
  }

  const isSiteAdmin = await canManageAsAdmin(reviewer);
  if (!group.isAdmin && !group.isAssistantLeader && !isSiteAdmin) {
    throw new Error("Leader access required.");
  }

  const completions = await store().listMinistryReadinessCompletionsForGroup(groupId, {
    source: "self_join",
  });
  const enriched = await Promise.all(
    completions.map(async (completion) => {
      const member = await getUserById(completion.userId);
      return {
        ...completion,
        userName: member?.name ?? "Member",
      };
    }),
  );
  return enriched;
}

export type PendingMinistryTraining = {
  groupId: string;
  groupName: string;
  packTitle: string;
};

export async function listPendingTrainingForUser(userId: string): Promise<PendingMinistryTraining[]> {
  const groups = await getGroups();
  const pending: PendingMinistryTraining[] = [];

  for (const group of groups) {
    if (!group.memberIds.includes(userId)) continue;
    const pack = resolveMinistryReadiness(group);
    if (!pack) continue;

    const completion = await store().getMinistryReadinessCompletion(userId, pack.readinessKey);
    if (!isTrainingRequiredCompletion(completion)) continue;

    pending.push({
      groupId: group.id,
      groupName: group.name,
      packTitle: pack.title,
    });
  }

  return pending.sort((left, right) => left.groupName.localeCompare(right.groupName));
}
