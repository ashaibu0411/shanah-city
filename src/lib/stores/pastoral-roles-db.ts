import { prisma } from "@/lib/db";
import type { PastoralRole, PastoralRoleAssignments } from "@/lib/pastoral-roles-types";

const ROLES: PastoralRole[] = ["senior_pastor", "associate_pastor"];

async function ensureSlots() {
  for (const role of ROLES) {
    await prisma.pastoralRoleSlot.upsert({
      where: { role },
      create: { role, userId: null },
      update: {},
    });
  }
}

function mapAssignments(
  records: Array<{
    role: string;
    userId: string | null;
    updatedAt: Date;
    updatedBy: string | null;
    updatedByName: string | null;
  }>,
): PastoralRoleAssignments {
  const senior = records.find((record) => record.role === "senior_pastor");
  const associate = records.find((record) => record.role === "associate_pastor");
  const latest = records.reduce<Date | null>((current, record) => {
    if (!current || record.updatedAt > current) return record.updatedAt;
    return current;
  }, null);
  const latestRecord =
    records.find((record) => latest && record.updatedAt.getTime() === latest.getTime()) ?? null;

  return {
    seniorPastorUserId: senior?.userId ?? null,
    associatePastorUserId: associate?.userId ?? null,
    updatedAt: latest?.toISOString(),
    updatedBy: latestRecord?.updatedBy ?? undefined,
    updatedByName: latestRecord?.updatedByName ?? undefined,
  };
}

export async function getPastoralRoleAssignments() {
  await ensureSlots();
  const records = await prisma.pastoralRoleSlot.findMany({
    where: { role: { in: ROLES } },
  });
  return mapAssignments(records);
}

export async function setPastoralRoleAssignment(input: {
  role: PastoralRole;
  userId: string | null;
  updatedBy: string;
  updatedByName: string;
}) {
  await ensureSlots();
  const now = new Date();

  if (input.userId) {
    await prisma.pastoralRoleSlot.updateMany({
      where: {
        userId: input.userId,
        role: { not: input.role },
      },
      data: {
        userId: null,
        updatedAt: now,
        updatedBy: input.updatedBy,
        updatedByName: input.updatedByName,
      },
    });
  }

  await prisma.pastoralRoleSlot.update({
    where: { role: input.role },
    data: {
      userId: input.userId,
      updatedAt: now,
      updatedBy: input.updatedBy,
      updatedByName: input.updatedByName,
    },
  });

  return getPastoralRoleAssignments();
}
