import { prisma } from "@/lib/db";
import type { CoupleLinkRecord, CoupleLinkStatus } from "@/lib/couple-link-types";
import { normalizeCoupleUserIds } from "@/lib/couple-link-utils";

function mapLink(record: {
  id: string;
  userAId: string;
  userBId: string;
  status: string;
  requestedBy: string;
  createdAt: Date;
  acceptedAt: Date | null;
  anniversaryDate: string | null;
}): CoupleLinkRecord {
  return {
    id: record.id,
    userAId: record.userAId,
    userBId: record.userBId,
    status: record.status as CoupleLinkStatus,
    requestedBy: record.requestedBy,
    anniversaryDate: record.anniversaryDate ?? undefined,
    createdAt: record.createdAt.toISOString(),
    acceptedAt: record.acceptedAt?.toISOString(),
  };
}

export async function getCoupleLinksForUser(userId: string) {
  const records = await prisma.coupleLink.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    orderBy: { createdAt: "desc" },
  });
  return records.map(mapLink);
}

export async function getActiveCoupleLinkForUser(userId: string) {
  const record = await prisma.coupleLink.findFirst({
    where: {
      status: "active",
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
  return record ? mapLink(record) : null;
}

export async function createCoupleLink(input: {
  userAId: string;
  userBId: string;
  requestedBy: string;
}) {
  const [userAId, userBId] = normalizeCoupleUserIds(input.userAId, input.userBId);
  const record = await prisma.coupleLink.create({
    data: {
      id: `couple-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userAId,
      userBId,
      requestedBy: input.requestedBy,
      status: "pending",
    },
  });
  return mapLink(record);
}

export async function updateCoupleLinkStatus(
  id: string,
  status: CoupleLinkStatus,
  acceptedAt?: Date | null,
) {
  const record = await prisma.coupleLink.update({
    where: { id },
    data: {
      status,
      acceptedAt: status === "active" ? (acceptedAt ?? new Date()) : null,
    },
  });
  return mapLink(record);
}

export async function deleteCoupleLink(id: string) {
  await prisma.coupleLink.delete({ where: { id } });
}

export async function getCoupleLinkById(id: string) {
  const record = await prisma.coupleLink.findUnique({ where: { id } });
  return record ? mapLink(record) : null;
}

export async function updateCoupleAnniversary(id: string, anniversaryDate: string) {
  const record = await prisma.coupleLink.update({
    where: { id },
    data: { anniversaryDate },
  });
  return mapLink(record);
}

export async function getActiveCoupleLinksForGroup(memberIds: string[]) {
  if (memberIds.length === 0) return [];
  const records = await prisma.coupleLink.findMany({
    where: {
      status: "active",
      OR: [{ userAId: { in: memberIds } }, { userBId: { in: memberIds } }],
    },
  });
  const byId = new Map<string, CoupleLinkRecord>();
  for (const record of records) {
    byId.set(record.id, mapLink(record));
  }
  return [...byId.values()];
}
