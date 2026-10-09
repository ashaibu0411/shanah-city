import { prisma } from "@/lib/db";
import type { CoupleMarriageGoalRecord, MarriageGoalCategory, MarriageGoalMilestone } from "@/lib/couple-marriage-goal-types";

function parseMilestones(json: string): MarriageGoalMilestone[] {
  try {
    const parsed = JSON.parse(json) as MarriageGoalMilestone[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapRow(row: {
  id: string;
  coupleLinkId: string;
  category: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  progress: number;
  milestonesJson: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): CoupleMarriageGoalRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    category: row.category as MarriageGoalCategory,
    title: row.title,
    description: row.description ?? undefined,
    targetDate: row.targetDate ?? undefined,
    progress: row.progress,
    milestones: parseMilestones(row.milestonesJson),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMarriageGoals(coupleLinkId: string) {
  const rows = await prisma.coupleMarriageGoal.findMany({
    where: { coupleLinkId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapRow);
}

export async function getMarriageGoal(id: string) {
  const row = await prisma.coupleMarriageGoal.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}

export async function createMarriageGoal(input: {
  coupleLinkId: string;
  createdBy: string;
  category: MarriageGoalCategory;
  title: string;
  description?: string;
  targetDate?: string;
  milestones?: MarriageGoalMilestone[];
}) {
  const row = await prisma.coupleMarriageGoal.create({
    data: {
      id: `cgoal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      category: input.category,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      targetDate: input.targetDate || null,
      progress: 0,
      milestonesJson: JSON.stringify(input.milestones ?? []),
      createdBy: input.createdBy,
    },
  });
  return mapRow(row);
}

export async function updateMarriageGoal(
  id: string,
  input: Partial<{
    category: MarriageGoalCategory;
    title: string;
    description: string | null;
    targetDate: string | null;
    progress: number;
    milestones: MarriageGoalMilestone[];
  }>,
) {
  const row = await prisma.coupleMarriageGoal.update({
    where: { id },
    data: {
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.targetDate !== undefined ? { targetDate: input.targetDate } : {}),
      ...(input.progress !== undefined ? { progress: input.progress } : {}),
      ...(input.milestones !== undefined
        ? { milestonesJson: JSON.stringify(input.milestones) }
        : {}),
    },
  });
  return mapRow(row);
}

export async function deleteMarriageGoal(id: string) {
  await prisma.coupleMarriageGoal.delete({ where: { id } });
}
