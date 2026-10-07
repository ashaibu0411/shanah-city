import type { PublicMember } from "@/lib/auth-types";
import { getDenverWeekRange, getZonedDateParts } from "@/lib/denver-time";
import { getGroupDetail } from "@/lib/group-server";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import { getPollsForViewer } from "@/lib/poll-server";
import { sendPushToGroupMembers } from "@/lib/push-server";
import { useDatabase } from "@/lib/use-database";
import {
  DEFAULT_MONDAY_BIBLE_STUDY_REMINDERS,
  groupHasMinistryHub,
  type MinistryHubBiblePlanDay,
  type MinistryHubEngagementSnapshot,
} from "@/lib/group-ministry-hub-types";
import { canManageMinistryHub } from "@/lib/group-ministry-hub-server";
import * as programDb from "@/lib/stores/group-ministry-hub-program-db";
import * as programJson from "@/lib/stores/group-ministry-hub-program-json";

const programStore = () => (useDatabase() ? programDb : programJson);

function assertHub(groupId: string) {
  if (!groupHasMinistryHub(groupId)) {
    throw new Error("This group does not use the ministry hub yet.");
  }
}

async function assertMember(user: PublicMember, groupId: string) {
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember) {
    throw new Error("Join this group under Groups to view the hub.");
  }
  return group;
}

function parsePlanDays(raw: unknown): MinistryHubBiblePlanDay[] {
  if (!Array.isArray(raw)) return [];
  const days: MinistryHubBiblePlanDay[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const day = Number((entry as { day?: number }).day);
    const title = String((entry as { title?: string }).title ?? "").trim();
    const passage = String((entry as { passage?: string }).passage ?? "").trim();
    if (!day || !title || !passage) continue;
    days.push({ day, title, passage });
  }
  return days.sort((a, b) => a.day - b.day);
}

async function buildEngagementSnapshot(
  groupId: string,
  user: PublicMember,
  challengeId?: string,
): Promise<MinistryHubEngagementSnapshot> {
  const group = await getGroupDetail(groupId, user.id);
  const memberCount = group?.members.length ?? 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const posts = await getCommunityPostsForViewer(user.id);
  const prayerPraiseLast7Days = posts.filter((post) => {
    if (post.targetGroupId !== groupId) return false;
    if (post.type !== "prayer" && post.type !== "praise") return false;
    if (!post.createdAt) return true;
    const created = Date.parse(post.createdAt);
    return !Number.isNaN(created) && created >= weekAgo;
  }).length;

  const polls = await getPollsForViewer(user, groupId);
  const groupPolls = polls.filter((poll) => poll.targetGroupId === groupId);
  const activePollCount = groupPolls.length;
  const pollVotersLast7Days = groupPolls.reduce((sum, poll) => {
    const voters = poll.totalVotes ?? 0;
    return sum + voters;
  }, 0);

  let challengeCheckInsThisWeek = 0;
  if (challengeId) {
    challengeCheckInsThisWeek = await programStore().countFaithChallengeCheckIns(challengeId);
  }

  return {
    memberCount,
    prayerPraiseLast7Days,
    activePollCount,
    pollVotersLast7Days,
    challengeCheckInsThisWeek,
  };
}

export async function getMinistryHubProgramForUser(user: PublicMember, groupId: string) {
  assertHub(groupId);
  await assertMember(user, groupId);

  const store = programStore();
  const [bibleStudy, biblePlan, faithChallenge] = await Promise.all([
    store.getGroupBibleStudy(groupId),
    store.getActiveBiblePlan(groupId),
    store.getActiveFaithChallenge(groupId),
  ]);

  const planProgress =
    biblePlan ? await store.getBiblePlanProgress(biblePlan.id, user.id) : [];
  const challengeCheckedIn =
    faithChallenge && user
      ? await store.hasFaithChallengeCheckIn(faithChallenge.id, user.id)
      : false;

  const canManage = await canManageMinistryHub(user, groupId);
  const engagement = canManage
    ? await buildEngagementSnapshot(groupId, user, faithChallenge?.id)
    : undefined;

  return {
    bibleStudy,
    biblePlan,
    planProgress,
    faithChallenge,
    challengeCheckedIn,
    canManage,
    engagement,
  };
}

export async function saveMinistryHubBibleStudy(
  user: PublicMember,
  input: {
    groupId: string;
    leaderUserId?: string;
    leaderName: string;
    topic: string;
    bibleBook: string;
    meetingTime?: string;
    reminder1Hour?: number;
    reminder1Minute?: number;
    reminder2Hour?: number;
    reminder2Minute?: number;
  },
) {
  assertHub(input.groupId);
  if (!(await canManageMinistryHub(user, input.groupId))) {
    throw new Error("Only group leaders and assistants can update bible study.");
  }
  const leaderName = input.leaderName.trim();
  const topic = input.topic.trim();
  const bibleBook = input.bibleBook.trim();
  if (!leaderName || !topic || !bibleBook) {
    throw new Error("Add leader, topic, and book or passage.");
  }

  const existing = await programStore().getGroupBibleStudy(input.groupId);
  const study = await programStore().saveGroupBibleStudy({
    groupId: input.groupId,
    leaderUserId: input.leaderUserId?.trim() || undefined,
    leaderName,
    topic,
    bibleBook,
    meetingWeekday: 1,
    meetingTime: input.meetingTime?.trim() || undefined,
    reminder1Hour: input.reminder1Hour ?? existing?.reminder1Hour ?? DEFAULT_MONDAY_BIBLE_STUDY_REMINDERS.reminder1Hour,
    reminder1Minute:
      input.reminder1Minute ?? existing?.reminder1Minute ?? DEFAULT_MONDAY_BIBLE_STUDY_REMINDERS.reminder1Minute,
    reminder2Hour: input.reminder2Hour ?? existing?.reminder2Hour ?? DEFAULT_MONDAY_BIBLE_STUDY_REMINDERS.reminder2Hour,
    reminder2Minute:
      input.reminder2Minute ?? existing?.reminder2Minute ?? DEFAULT_MONDAY_BIBLE_STUDY_REMINDERS.reminder2Minute,
    lastReminder1DateKey: existing?.lastReminder1DateKey,
    lastReminder2DateKey: existing?.lastReminder2DateKey,
  });

  return study;
}

export async function broadcastMinistryHubMessage(
  user: PublicMember,
  input: { groupId: string; title: string; body: string },
) {
  assertHub(input.groupId);
  if (!(await canManageMinistryHub(user, input.groupId))) {
    throw new Error("Only group leaders and assistants can notify the group.");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    throw new Error("Add a title and message.");
  }

  const push = await sendPushToGroupMembers(
    input.groupId,
    {
      title,
      body: body.slice(0, 180),
      url: `/groups/${encodeURIComponent(input.groupId)}`,
    },
    "announcements",
    user.id,
  );

  return { ok: true, push };
}

export async function saveMinistryHubBiblePlan(
  user: PublicMember,
  input: { groupId: string; title: string; days: unknown },
) {
  assertHub(input.groupId);
  if (!(await canManageMinistryHub(user, input.groupId))) {
    throw new Error("Only group leaders and assistants can publish a reading plan.");
  }
  const title = input.title.trim();
  const days = parsePlanDays(input.days);
  if (!title || days.length === 0) {
    throw new Error("Add a plan title and at least one day with passage.");
  }
  return programStore().saveBiblePlan({ groupId: input.groupId, title, days });
}

export async function updateMinistryHubPlanProgress(
  user: PublicMember,
  input: { groupId: string; planId: string; dayIndex: number; completed: boolean },
) {
  assertHub(input.groupId);
  await assertMember(user, input.groupId);
  const plan = await programStore().getActiveBiblePlan(input.groupId);
  if (!plan || plan.id !== input.planId) {
    throw new Error("Reading plan not found.");
  }
  const dayIndex = Math.floor(input.dayIndex);
  if (dayIndex < 1 || dayIndex > plan.days.length) {
    throw new Error("Invalid day.");
  }
  const completedDays = await programStore().setBiblePlanDayComplete(
    plan.id,
    user.id,
    dayIndex,
    input.completed,
  );
  return { completedDays };
}

export async function saveMinistryHubFaithChallenge(
  user: PublicMember,
  input: { groupId: string; title: string; body: string; weekStart?: string },
) {
  assertHub(input.groupId);
  if (!(await canManageMinistryHub(user, input.groupId))) {
    throw new Error("Only group leaders and assistants can post a challenge.");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    throw new Error("Add a challenge title and description.");
  }
  const weekStart = input.weekStart?.trim() || getDenverWeekRange().since;
  return programStore().saveFaithChallenge({
    groupId: input.groupId,
    title,
    body,
    weekStart,
  });
}

export async function checkInMinistryHubFaithChallenge(
  user: PublicMember,
  input: { groupId: string; challengeId: string },
) {
  assertHub(input.groupId);
  await assertMember(user, input.groupId);
  const challenge = await programStore().getActiveFaithChallenge(input.groupId);
  if (!challenge || challenge.id !== input.challengeId) {
    throw new Error("Challenge not found.");
  }
  await programStore().addFaithChallengeCheckIn(challenge.id, user.id);
  return { checkedIn: true };
}

export function isBibleStudyReminderDue(
  study: {
    meetingWeekday: number;
    reminder1Hour: number;
    reminder1Minute: number;
    reminder2Hour: number;
    reminder2Minute: number;
    lastReminder1DateKey?: string;
    lastReminder2DateKey?: string;
  },
  slot: 1 | 2,
  reference = new Date(),
) {
  const denver = getZonedDateParts(reference);
  if (denver.weekday !== study.meetingWeekday) return false;

  const hour = slot === 1 ? study.reminder1Hour : study.reminder2Hour;
  const minute = slot === 1 ? study.reminder1Minute : study.reminder2Minute;
  const notifyAt = hour * 60 + minute;
  const now = denver.hour * 60 + denver.minute;
  const inWindow = now >= notifyAt - 5 && now < notifyAt + 25;
  if (!inWindow) return false;

  const lastKey = slot === 1 ? study.lastReminder1DateKey : study.lastReminder2DateKey;
  return lastKey !== denver.dateKey;
}

export async function processMondayBibleStudyReminders(reference = new Date()) {
  const studies = await programStore().listHubBibleStudies();
  const denver = getZonedDateParts(reference);
  const attempts: Array<{ groupId: string; slot: number; sent: number }> = [];

  for (const study of studies) {
    for (const slot of [1, 2] as const) {
      if (!isBibleStudyReminderDue(study, slot, reference)) continue;

      const timeLabel = study.meetingTime ? ` · ${study.meetingTime}` : "";
      const title =
        slot === 1 ? "Monday bible study today" : "Bible study reminder";
      const body =
        slot === 1
          ? `${study.leaderName} leads ${study.bibleBook} — ${study.topic}${timeLabel}`
          : `Tonight: ${study.topic} (${study.bibleBook}) with ${study.leaderName}${timeLabel}`;

      const push = await sendPushToGroupMembers(
        study.groupId,
        {
          title,
          body,
          url: `/groups/${encodeURIComponent(study.groupId)}`,
        },
        "announcements",
      );

      await programStore().markBibleStudyReminderSent(study.groupId, slot, denver.dateKey);
      attempts.push({ groupId: study.groupId, slot, sent: push.sent });
    }
  }

  return {
    denverDate: denver.dateKey,
    attempts,
    processed: attempts.length,
  };
}
