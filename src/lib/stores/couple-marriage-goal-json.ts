import { promises as fs } from "fs";
import path from "path";
import type { CoupleMarriageGoalRecord, MarriageGoalCategory, MarriageGoalMilestone } from "@/lib/couple-marriage-goal-types";

const FILE = path.join(process.cwd(), "data", "couple-marriage-goals.json");

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8")) as CoupleMarriageGoalRecord[];
  } catch {
    return [];
  }
}

async function writeAll(goals: CoupleMarriageGoalRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(goals, null, 2));
}

export async function listMarriageGoals(coupleLinkId: string) {
  return (await readAll())
    .filter((g) => g.coupleLinkId === coupleLinkId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getMarriageGoal(id: string) {
  return (await readAll()).find((g) => g.id === id) ?? null;
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
  const goals = await readAll();
  const now = new Date().toISOString();
  const record: CoupleMarriageGoalRecord = {
    id: `cgoal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    category: input.category,
    title: input.title.trim(),
    description: input.description?.trim(),
    targetDate: input.targetDate,
    progress: 0,
    milestones: input.milestones ?? [],
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  goals.push(record);
  await writeAll(goals);
  return record;
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
  const goals = await readAll();
  const index = goals.findIndex((g) => g.id === id);
  if (index === -1) throw new Error("Goal not found.");
  goals[index] = {
    ...goals[index],
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description ?? undefined } : {}),
    ...(input.targetDate !== undefined ? { targetDate: input.targetDate ?? undefined } : {}),
    ...(input.progress !== undefined ? { progress: input.progress } : {}),
    ...(input.milestones !== undefined ? { milestones: input.milestones } : {}),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(goals);
  return goals[index];
}

export async function deleteMarriageGoal(id: string) {
  await writeAll((await readAll()).filter((g) => g.id !== id));
}
