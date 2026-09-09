import { prisma } from "@/lib/db";
import type {
  CoupleEnrichmentModuleRecord,
  CoupleEnrichmentModuleView,
} from "@/lib/couple-enrichment-types";

function mapModule(record: {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): CoupleEnrichmentModuleRecord {
  return {
    id: record.id,
    groupId: record.groupId,
    title: record.title,
    description: record.description ?? undefined,
    sortOrder: record.sortOrder,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getEnrichmentModules(groupId: string) {
  const records = await prisma.coupleEnrichmentModule.findMany({
    where: { groupId },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return records.map(mapModule);
}

export async function createEnrichmentModule(input: {
  groupId: string;
  title: string;
  description?: string;
  sortOrder?: number;
  createdBy: string;
  createdByName: string;
}) {
  const now = new Date();
  const record = await prisma.coupleEnrichmentModule.create({
    data: {
      id: `enrich-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      groupId: input.groupId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      createdAt: now,
      updatedAt: now,
    },
  });
  return mapModule(record);
}

export async function deleteEnrichmentModule(id: string) {
  await prisma.coupleEnrichmentProgress.deleteMany({ where: { moduleId: id } });
  await prisma.coupleEnrichmentModule.delete({ where: { id } });
}

export async function getProgressForCoupleLink(coupleLinkId: string) {
  return prisma.coupleEnrichmentProgress.findMany({ where: { coupleLinkId } });
}

export async function setEnrichmentProgress(input: {
  moduleId: string;
  coupleLinkId: string;
  completed: boolean;
  userId: string;
  userName: string;
}) {
  if (!input.completed) {
    await prisma.coupleEnrichmentProgress.deleteMany({
      where: { moduleId: input.moduleId, coupleLinkId: input.coupleLinkId },
    });
    return null;
  }

  const record = await prisma.coupleEnrichmentProgress.upsert({
    where: {
      moduleId_coupleLinkId: {
        moduleId: input.moduleId,
        coupleLinkId: input.coupleLinkId,
      },
    },
    create: {
      id: `enrich-prog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      moduleId: input.moduleId,
      coupleLinkId: input.coupleLinkId,
      completedBy: input.userId,
      completedByName: input.userName,
    },
    update: {
      completedBy: input.userId,
      completedByName: input.userName,
      completedAt: new Date(),
    },
  });
  return record;
}

export async function buildModuleViews(
  modules: CoupleEnrichmentModuleRecord[],
  coupleLinkId: string | null,
): Promise<CoupleEnrichmentModuleView[]> {
  if (!coupleLinkId) {
    return modules.map((module) => ({ ...module, completed: false }));
  }
  const progress = await getProgressForCoupleLink(coupleLinkId);
  const completedIds = new Set(progress.map((entry) => entry.moduleId));
  const completedAtByModule = new Map(
    progress.map((entry) => [entry.moduleId, entry.completedAt.toISOString()]),
  );
  return modules.map((module) => ({
    ...module,
    completed: completedIds.has(module.id),
    completedAt: completedAtByModule.get(module.id),
  }));
}
