import { prisma } from "@/lib/db";
import type { CoupleMentorRequestRecord } from "@/lib/couple-mentor-types";

function mapRequest(record: {
  id: string;
  coupleLinkId: string;
  requesterId: string;
  requesterName: string;
  note: string | null;
  status: string;
  mentorLinkId: string | null;
  matchedBy: string | null;
  matchedByName: string | null;
  matchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CoupleMentorRequestRecord {
  return {
    id: record.id,
    coupleLinkId: record.coupleLinkId,
    requesterId: record.requesterId,
    requesterName: record.requesterName,
    note: record.note ?? undefined,
    status: record.status as CoupleMentorRequestRecord["status"],
    mentorLinkId: record.mentorLinkId ?? undefined,
    matchedBy: record.matchedBy ?? undefined,
    matchedByName: record.matchedByName ?? undefined,
    matchedAt: record.matchedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getMentorRequestById(id: string) {
  const record = await prisma.coupleMentorRequest.findUnique({ where: { id } });
  return record ? mapRequest(record) : null;
}

export async function getOpenMentorRequestForCouple(coupleLinkId: string) {
  const record = await prisma.coupleMentorRequest.findFirst({
    where: { coupleLinkId, status: { in: ["open", "matched"] } },
    orderBy: { createdAt: "desc" },
  });
  return record ? mapRequest(record) : null;
}

export async function listMentorRequestsForCoupleLinks(coupleLinkIds: string[]) {
  if (coupleLinkIds.length === 0) return [];
  const records = await prisma.coupleMentorRequest.findMany({
    where: { coupleLinkId: { in: coupleLinkIds } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return records.map(mapRequest);
}

export async function createMentorRequest(input: {
  coupleLinkId: string;
  requesterId: string;
  requesterName: string;
  note?: string;
}) {
  const now = new Date();
  const record = await prisma.coupleMentorRequest.create({
    data: {
      id: `mentor-req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      note: input.note?.trim() || null,
      status: "open",
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapRequest(record);
}

export async function matchMentorRequest(input: {
  id: string;
  mentorLinkId: string;
  matchedBy: string;
  matchedByName: string;
}) {
  const record = await prisma.coupleMentorRequest.update({
    where: { id: input.id },
    data: {
      status: "matched",
      mentorLinkId: input.mentorLinkId,
      matchedBy: input.matchedBy,
      matchedByName: input.matchedByName,
      matchedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return mapRequest(record);
}

export async function closeMentorRequest(id: string) {
  const record = await prisma.coupleMentorRequest.update({
    where: { id },
    data: { status: "closed", updatedAt: new Date() },
  });
  return mapRequest(record);
}
