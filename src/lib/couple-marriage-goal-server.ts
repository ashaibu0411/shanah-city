import type { PublicMember } from "@/lib/auth-types";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import {
  MARRIAGE_GOAL_CATEGORIES,
  type MarriageGoalCategory,
  type MarriageGoalMilestone,
} from "@/lib/couple-marriage-goal-types";
import { useDatabase } from "@/lib/use-database";
import * as coupleMarriageGoalDb from "@/lib/stores/couple-marriage-goal-db";
import * as coupleMarriageGoalJson from "@/lib/stores/couple-marriage-goal-json";

const store = () => (useDatabase() ? coupleMarriageGoalDb : coupleMarriageGoalJson);

function parseCategory(value: unknown): MarriageGoalCategory {
  const raw = String(value ?? "spiritual");
  const allowed = new Set(MARRIAGE_GOAL_CATEGORIES.map((c) => c.id));
  return allowed.has(raw as MarriageGoalCategory) ? (raw as MarriageGoalCategory) : "spiritual";
}

function progressFromMilestones(milestones: MarriageGoalMilestone[]) {
  if (!milestones.length) return 0;
  const done = milestones.filter((m) => m.done).length;
  return Math.round((done / milestones.length) * 100);
}

function parseMilestones(value: unknown): MarriageGoalMilestone[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item, index) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? `ms-${index}-${Date.now()}`),
      title: String(row.title ?? "").trim(),
      done: Boolean(row.done),
    };
  }).filter((m) => m.title);
}

async function assertGoalAccess(user: PublicMember, goalId: string) {
  const link = await assertActiveCoupleWorkspace(user);
  const goal = await store().getMarriageGoal(goalId);
  if (!goal || goal.coupleLinkId !== link.id) {
    throw new Error("Goal not found.");
  }
  return { link, goal };
}

export async function getCoupleMarriageGoalsForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const goals = await store().listMarriageGoals(link.id);
  return { coupleLinkId: link.id, categories: MARRIAGE_GOAL_CATEGORIES, goals };
}

export async function createCoupleMarriageGoalForUser(user: PublicMember, body: Record<string, unknown>) {
  const link = await assertActiveCoupleWorkspace(user);
  const title = String(body.title ?? "").trim();
  if (!title) throw new Error("Add a goal title.");
  if (title.length > 200) throw new Error("Title is too long.");

  const milestones = parseMilestones(body.milestones) ?? [];
  const progress = progressFromMilestones(milestones);

  const record = await store().createMarriageGoal({
    coupleLinkId: link.id,
    createdBy: user.id,
    category: parseCategory(body.category),
    title,
    description: String(body.description ?? "").trim() || undefined,
    targetDate: String(body.targetDate ?? "").trim() || undefined,
    milestones,
  });

  if (progress > 0) {
    await store().updateMarriageGoal(record.id, { progress });
  }

  return getCoupleMarriageGoalsForUser(user);
}

export async function updateCoupleMarriageGoalForUser(
  user: PublicMember,
  goalId: string,
  body: Record<string, unknown>,
) {
  const { goal } = await assertGoalAccess(user, goalId);

  const milestones = parseMilestones(body.milestones);
  const title = body.title !== undefined ? String(body.title).trim() : undefined;
  if (title !== undefined && !title) throw new Error("Title cannot be empty.");

  const nextMilestones = milestones ?? goal.milestones;
  const progress =
    body.progress !== undefined
      ? Math.min(100, Math.max(0, Number(body.progress) || 0))
      : progressFromMilestones(nextMilestones);

  await store().updateMarriageGoal(goalId, {
    ...(body.category !== undefined ? { category: parseCategory(body.category) } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(body.description !== undefined
      ? { description: String(body.description).trim() || null }
      : {}),
    ...(body.targetDate !== undefined
      ? { targetDate: String(body.targetDate).trim() || null }
      : {}),
    progress,
    ...(milestones !== undefined ? { milestones: nextMilestones } : {}),
  });

  return getCoupleMarriageGoalsForUser(user);
}

export async function deleteCoupleMarriageGoalForUser(user: PublicMember, goalId: string) {
  await assertGoalAccess(user, goalId);
  await store().deleteMarriageGoal(goalId);
  return getCoupleMarriageGoalsForUser(user);
}

export async function toggleCoupleMarriageGoalMilestoneForUser(
  user: PublicMember,
  goalId: string,
  milestoneId: string,
) {
  const { goal } = await assertGoalAccess(user, goalId);
  const milestones = goal.milestones.map((m) =>
    m.id === milestoneId ? { ...m, done: !m.done } : m,
  );
  const progress = progressFromMilestones(milestones);
  await store().updateMarriageGoal(goalId, { milestones, progress });
  return getCoupleMarriageGoalsForUser(user);
}
