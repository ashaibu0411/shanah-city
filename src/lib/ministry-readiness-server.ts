import { useDatabase } from "@/lib/use-database";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { getGroupDetail } from "@/lib/group-server";
import {
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

export async function getReadinessStatusForGroup(userId: string, groupId: string) {
  const group = await getGroupDetail(groupId, userId);
  if (!group) return null;

  const pack = resolveMinistryReadiness(group);
  if (!pack) return null;

  if (group.isMember) {
    return null;
  }

  const completion = await store().getMinistryReadinessCompletion(userId, pack.readinessKey);
  return toPublicReadinessPack(pack, completion);
}

export async function hasMinistryReadinessAccess(userId: string, readinessKey: MinistryReadinessKey) {
  const completion = await store().getMinistryReadinessCompletion(userId, readinessKey);
  return Boolean(completion);
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

  if (group.isMember) {
    throw new Error("You are already a member of this team.");
  }

  const pack = resolveMinistryReadiness(group);
  if (!pack) {
    throw new Error("This group does not require readiness training.");
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
