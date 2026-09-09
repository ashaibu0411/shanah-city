import { prisma } from "@/lib/db";
import type { CreateGroupResourceInput, GroupResourceRecord } from "@/lib/group-resource-types";

function mapResource(record: {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string;
  sortOrder: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): GroupResourceRecord {
  return {
    id: record.id,
    groupId: record.groupId,
    title: record.title,
    description: record.description ?? undefined,
    url: record.url ?? undefined,
    category: record.category,
    sortOrder: record.sortOrder,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getGroupResources(groupId: string) {
  const records = await prisma.groupResource.findMany({
    where: { groupId },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return records.map(mapResource);
}

export async function createGroupResource(input: CreateGroupResourceInput) {
  const now = new Date();
  const record = await prisma.groupResource.create({
    data: {
      id: `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      groupId: input.groupId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      url: input.url?.trim() || null,
      category: input.category?.trim() || "marriage",
      sortOrder: input.sortOrder ?? 0,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapResource(record);
}

export async function updateGroupResource(
  id: string,
  update: Partial<Pick<GroupResourceRecord, "title" | "description" | "url" | "category" | "sortOrder">>,
) {
  const record = await prisma.groupResource.update({
    where: { id },
    data: {
      title: update.title?.trim(),
      description: update.description === undefined ? undefined : update.description?.trim() || null,
      url: update.url === undefined ? undefined : update.url?.trim() || null,
      category: update.category?.trim(),
      sortOrder: update.sortOrder,
      updatedAt: new Date(),
    },
  });
  return mapResource(record);
}

export async function deleteGroupResource(id: string) {
  await prisma.groupResource.delete({ where: { id } });
}

export async function getGroupResourceById(id: string) {
  const record = await prisma.groupResource.findUnique({ where: { id } });
  return record ? mapResource(record) : null;
}
