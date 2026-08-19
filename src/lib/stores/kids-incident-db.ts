import { prisma } from "@/lib/db";
import type { KidsIncident } from "@/lib/kids-types";

function mapIncident(record: {
  id: string;
  checkInId: string | null;
  childName: string;
  parentUserId: string | null;
  ageGroup: string;
  service: string;
  severity: string;
  summary: string;
  details: string | null;
  actionTaken: string | null;
  reportedBy: string;
  reportedByName: string;
  parentNotified: boolean;
  notifiedAt: Date | null;
  createdAt: Date;
}): KidsIncident {
  return {
    id: record.id,
    checkInId: record.checkInId ?? undefined,
    childName: record.childName,
    parentUserId: record.parentUserId ?? undefined,
    ageGroup: record.ageGroup,
    service: record.service,
    severity: record.severity as KidsIncident["severity"],
    summary: record.summary,
    details: record.details ?? undefined,
    actionTaken: record.actionTaken ?? undefined,
    reportedBy: record.reportedBy,
    reportedByName: record.reportedByName,
    parentNotified: record.parentNotified,
    notifiedAt: record.notifiedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listKidsIncidents(options?: { service?: string; limit?: number }) {
  const where: { service?: string } = {};
  if (options?.service) where.service = options.service;

  const records = await prisma.kidsIncident.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit,
  });
  return records.map(mapIncident);
}

export async function addKidsIncident(incident: KidsIncident) {
  const record = await prisma.kidsIncident.create({
    data: {
      id: incident.id,
      checkInId: incident.checkInId ?? null,
      childName: incident.childName,
      parentUserId: incident.parentUserId ?? null,
      ageGroup: incident.ageGroup,
      service: incident.service,
      severity: incident.severity,
      summary: incident.summary,
      details: incident.details ?? null,
      actionTaken: incident.actionTaken ?? null,
      reportedBy: incident.reportedBy,
      reportedByName: incident.reportedByName,
      parentNotified: incident.parentNotified,
      notifiedAt: incident.notifiedAt ? new Date(incident.notifiedAt) : null,
      createdAt: new Date(incident.createdAt),
    },
  });
  return mapIncident(record);
}

export async function markKidsIncidentNotified(id: string) {
  const existing = await prisma.kidsIncident.findUnique({ where: { id } });
  if (!existing) return null;

  const record = await prisma.kidsIncident.update({
    where: { id },
    data: {
      parentNotified: true,
      notifiedAt: new Date(),
    },
  });
  return mapIncident(record);
}
