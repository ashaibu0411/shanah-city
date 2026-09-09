import { prisma } from "@/lib/db";
import type { GroupCategory } from "@/lib/group-types";
import {
  defaultRosterRolesForGroup,
  normalizeRosterSlots,
  previousSundayIso,
  type GroupRosterSlot,
  type GroupServiceRoster,
} from "@/lib/group-roster-types";

function parseSlots(value: unknown): GroupRosterSlot[] {
  if (!Array.isArray(value)) return [];
  return normalizeRosterSlots(value as GroupRosterSlot[]);
}

function mapRoster(record: {
  id: string;
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  title: string | null;
  assignments: unknown;
  notes: string | null;
  status: string;
  publishedAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): GroupServiceRoster {
  return {
    id: record.id,
    groupId: record.groupId,
    serviceDate: record.serviceDate,
    serviceTime: record.serviceTime,
    title: record.title,
    assignments: parseSlots(record.assignments),
    notes: record.notes,
    status: record.status as GroupServiceRoster["status"],
    publishedAt: record.publishedAt?.toISOString(),
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getGroupRosterTemplateRoles(group: {
  id: string;
  name: string;
  category: GroupCategory;
}) {
  const record = await prisma.groupRosterTemplate.findUnique({ where: { groupId: group.id } });
  if (record && Array.isArray(record.roles) && record.roles.length > 0) {
    return (record.roles as string[]).map((role) => String(role).trim()).filter(Boolean);
  }
  return defaultRosterRolesForGroup(group);
}

export async function saveGroupRosterTemplateRoles(groupId: string, roles: string[]) {
  const cleaned = roles.map((role) => role.trim()).filter(Boolean);
  await prisma.groupRosterTemplate.upsert({
    where: { groupId },
    create: { groupId, roles: cleaned },
    update: { roles: cleaned },
  });
  return cleaned;
}

export async function listGroupServiceRosters(options: {
  groupId: string;
  since?: string;
  until?: string;
}) {
  const where: {
    groupId: string;
    serviceDate?: { gte?: string; lte?: string };
  } = { groupId: options.groupId };
  if (options.since || options.until) {
    where.serviceDate = {};
    if (options.since) where.serviceDate.gte = options.since;
    if (options.until) where.serviceDate.lte = options.until;
  }

  const records = await prisma.groupServiceRoster.findMany({
    where,
    orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }],
  });
  return records.map(mapRoster);
}

export async function getGroupServiceRoster(
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) {
  const record = await prisma.groupServiceRoster.findUnique({
    where: {
      groupId_serviceDate_serviceTime: { groupId, serviceDate, serviceTime },
    },
  });
  return record ? mapRoster(record) : null;
}

export async function findPreviousGroupServiceRoster(
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) {
  const prevSunday = previousSundayIso(serviceDate);
  const exact = await prisma.groupServiceRoster.findUnique({
    where: {
      groupId_serviceDate_serviceTime: {
        groupId,
        serviceDate: prevSunday,
        serviceTime,
      },
    },
  });
  if (exact) return mapRoster(exact);

  const record = await prisma.groupServiceRoster.findFirst({
    where: { groupId, serviceTime, serviceDate: { lt: serviceDate } },
    orderBy: [{ serviceDate: "desc" }, { serviceTime: "asc" }],
  });
  return record ? mapRoster(record) : null;
}

export async function saveGroupServiceRoster(input: {
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  title?: string;
  assignments: GroupRosterSlot[];
  notes?: string;
  status: GroupServiceRoster["status"];
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const assignments = normalizeRosterSlots(input.assignments);
  const existing = await prisma.groupServiceRoster.findUnique({
    where: {
      groupId_serviceDate_serviceTime: {
        groupId: input.groupId,
        serviceDate: input.serviceDate,
        serviceTime: input.serviceTime,
      },
    },
  });

  const data = {
    title: input.title?.trim() || null,
    assignments,
    notes: input.notes?.trim() || null,
    status: input.status,
    updatedAt: now,
    publishedAt:
      input.status === "published"
        ? existing?.publishedAt ?? now
        : input.status === "draft"
          ? null
          : existing?.publishedAt,
  };

  const record = existing
    ? await prisma.groupServiceRoster.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.groupServiceRoster.create({
        data: {
          id: `group-roster-${Date.now()}`,
          groupId: input.groupId,
          serviceDate: input.serviceDate,
          serviceTime: input.serviceTime,
          ...data,
          createdBy: input.actor.id,
          createdByName: input.actor.name,
          createdAt: now,
        },
      });

  return mapRoster(record);
}

export async function deleteGroupServiceRoster(
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) {
  const existing = await prisma.groupServiceRoster.findUnique({
    where: {
      groupId_serviceDate_serviceTime: { groupId, serviceDate, serviceTime },
    },
  });
  if (!existing) return false;
  await prisma.groupServiceRoster.delete({ where: { id: existing.id } });
  return true;
}
