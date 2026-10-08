import { prisma } from "@/lib/db";
import type {
  CoupleDateNightPlanRecord,
  DateNightBudget,
  DateNightLocation,
  DateNightPlanStatus,
} from "@/lib/couple-date-night-types";

function mapRow(row: {
  id: string;
  coupleLinkId: string;
  title: string;
  budget: string | null;
  locationType: string | null;
  scheduledAt: Date | null;
  isSurprise: boolean;
  invitedUserId: string | null;
  status: string;
  completedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}): CoupleDateNightPlanRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    title: row.title,
    budget: (row.budget as DateNightBudget | null) ?? undefined,
    locationType: (row.locationType as DateNightLocation | null) ?? undefined,
    scheduledAt: row.scheduledAt?.toISOString(),
    isSurprise: row.isSurprise,
    invitedUserId: row.invitedUserId ?? undefined,
    status: row.status as DateNightPlanStatus,
    completedAt: row.completedAt?.toISOString(),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCoupleDateNightPlans(coupleLinkId: string) {
  const rows = await prisma.coupleDateNightPlan.findMany({
    where: { coupleLinkId },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(mapRow);
}

export async function getCoupleDateNightPlanById(id: string) {
  const row = await prisma.coupleDateNightPlan.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
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
  const row = await prisma.coupleDateNightPlan.create({
    data: {
      id: `cdate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      createdBy: input.createdBy,
      title: input.title.trim(),
      budget: input.budget ?? null,
      locationType: input.locationType ?? null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      isSurprise: input.isSurprise ?? false,
      invitedUserId: input.invitedUserId ?? null,
      status: input.status ?? (input.scheduledAt ? "planned" : "idea"),
    },
  });
  return mapRow(row);
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
  const row = await prisma.coupleDateNightPlan.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.budget !== undefined ? { budget: input.budget } : {}),
      ...(input.locationType !== undefined ? { locationType: input.locationType } : {}),
      ...(input.scheduledAt !== undefined
        ? { scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null }
        : {}),
      ...(input.isSurprise !== undefined ? { isSurprise: input.isSurprise } : {}),
      ...(input.invitedUserId !== undefined ? { invitedUserId: input.invitedUserId } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.completedAt !== undefined
        ? { completedAt: input.completedAt ? new Date(input.completedAt) : null }
        : {}),
    },
  });
  return mapRow(row);
}

export async function deleteCoupleDateNightPlan(id: string) {
  await prisma.coupleDateNightPlan.delete({ where: { id } });
}
