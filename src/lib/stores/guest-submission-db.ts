import { prisma } from "@/lib/db";
import type { GuestSubmission, GuestSubmissionStatus } from "@/lib/frontliners-types";

function mapGuest(record: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  visitDate: string | null;
  serviceTime: string | null;
  isFirstVisit: boolean;
  notes: string | null;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
}): GuestSubmission {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    visitDate: record.visitDate,
    serviceTime: record.serviceTime,
    isFirstVisit: record.isFirstVisit,
    notes: record.notes,
    status: record.status as GuestSubmissionStatus,
    submittedAt: record.submittedAt.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString(),
    reviewedBy: record.reviewedBy,
    reviewedByName: record.reviewedByName,
  };
}

export async function listGuestSubmissions(options?: {
  status?: GuestSubmissionStatus;
  limit?: number;
}) {
  const records = await prisma.guestSubmission.findMany({
    where: options?.status ? { status: options.status } : undefined,
    orderBy: { submittedAt: "desc" },
    take: options?.limit,
  });
  return records.map(mapGuest);
}

export async function addGuestSubmission(input: {
  name: string;
  email?: string;
  phone?: string;
  visitDate?: string;
  serviceTime?: string;
  isFirstVisit?: boolean;
  notes?: string;
}) {
  const now = new Date();
  const record = await prisma.guestSubmission.create({
    data: {
      id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      visitDate: input.visitDate?.trim() || null,
      serviceTime: input.serviceTime?.trim() || null,
      isFirstVisit: input.isFirstVisit ?? true,
      notes: input.notes?.trim() || null,
      status: "new",
      submittedAt: now,
    },
  });
  return mapGuest(record);
}

export async function updateGuestSubmission(
  id: string,
  update: {
    status?: GuestSubmissionStatus;
    reviewedBy?: string;
    reviewedByName?: string;
  },
) {
  const existing = await prisma.guestSubmission.findUnique({ where: { id } });
  if (!existing) return null;

  const record = await prisma.guestSubmission.update({
    where: { id },
    data: {
      status: update.status ?? existing.status,
      reviewedAt: update.status ? new Date() : existing.reviewedAt,
      reviewedBy: update.reviewedBy ?? existing.reviewedBy,
      reviewedByName: update.reviewedByName ?? existing.reviewedByName,
    },
  });
  return mapGuest(record);
}
