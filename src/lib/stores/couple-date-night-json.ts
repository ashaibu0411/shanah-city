import { promises as fs } from "fs";
import path from "path";
import type {
  CoupleDateNightPlanRecord,
  DateNightBudget,
  DateNightLocation,
  DateNightPlanStatus,
} from "@/lib/couple-date-night-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "couple-date-night-plans.json");

async function readPlans() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as CoupleDateNightPlanRecord[];
  } catch {
    return [];
  }
}

async function writePlans(plans: CoupleDateNightPlanRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(plans, null, 2));
}

export async function listCoupleDateNightPlans(coupleLinkId: string) {
  const plans = await readPlans();
  return plans
    .filter((plan) => plan.coupleLinkId === coupleLinkId)
    .sort((a, b) => {
      const aTime = a.scheduledAt ?? a.createdAt;
      const bTime = b.scheduledAt ?? b.createdAt;
      return aTime.localeCompare(bTime);
    });
}

export async function getCoupleDateNightPlanById(id: string) {
  const plans = await readPlans();
  return plans.find((plan) => plan.id === id) ?? null;
}

export async function createCoupleDateNightPlan(input: {
  coupleLinkId: string;
  createdBy: string;
  title: string;
  budget?: DateNightBudget;
  locationType?: DateNightLocation;
  scheduledAt?: string;
  isSurprise?: boolean;
  invitedUserId?: string;
  status?: DateNightPlanStatus;
}) {
  const plans = await readPlans();
  const now = new Date().toISOString();
  const record: CoupleDateNightPlanRecord = {
    id: `cdate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    createdBy: input.createdBy,
    title: input.title.trim(),
    budget: input.budget,
    locationType: input.locationType,
    scheduledAt: input.scheduledAt,
    isSurprise: input.isSurprise ?? false,
    invitedUserId: input.invitedUserId,
    status: input.status ?? (input.scheduledAt ? "planned" : "idea"),
    createdAt: now,
    updatedAt: now,
  };
  plans.push(record);
  await writePlans(plans);
  return record;
}

export async function updateCoupleDateNightPlan(
  id: string,
  input: Partial<{
    title: string;
    budget: DateNightBudget | null;
    locationType: DateNightLocation | null;
    scheduledAt: string | null;
    isSurprise: boolean;
    invitedUserId: string | null;
    status: DateNightPlanStatus;
    completedAt: string | null;
  }>,
) {
  const plans = await readPlans();
  const index = plans.findIndex((plan) => plan.id === id);
  if (index === -1) throw new Error("Date not found.");

  const current = plans[index];
  plans[index] = {
    ...current,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.budget !== undefined ? { budget: input.budget ?? undefined } : {}),
    ...(input.locationType !== undefined ? { locationType: input.locationType ?? undefined } : {}),
    ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt ?? undefined } : {}),
    ...(input.isSurprise !== undefined ? { isSurprise: input.isSurprise } : {}),
    ...(input.invitedUserId !== undefined ? { invitedUserId: input.invitedUserId ?? undefined } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.completedAt !== undefined ? { completedAt: input.completedAt ?? undefined } : {}),
    updatedAt: new Date().toISOString(),
  };
  await writePlans(plans);
  return plans[index];
}

export async function deleteCoupleDateNightPlan(id: string) {
  const plans = await readPlans();
  await writePlans(plans.filter((plan) => plan.id !== id));
}
