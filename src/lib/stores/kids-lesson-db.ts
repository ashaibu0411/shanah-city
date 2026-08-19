import { prisma } from "@/lib/db";
import type { KidsLesson } from "@/lib/kids-types";

function mapLesson(record: {
  id: string;
  weekStarting: string;
  ageGroup: string;
  title: string;
  content: string;
  status: string;
  publishedAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): KidsLesson {
  return {
    id: record.id,
    weekStarting: record.weekStarting,
    ageGroup: record.ageGroup,
    title: record.title,
    content: record.content,
    status: record.status as KidsLesson["status"],
    publishedAt: record.publishedAt?.toISOString(),
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listKidsLessons(options?: { weekStarting?: string; status?: KidsLesson["status"] }) {
  const where: { weekStarting?: string; status?: string } = {};
  if (options?.weekStarting) where.weekStarting = options.weekStarting;
  if (options?.status) where.status = options.status;

  const records = await prisma.kidsLesson.findMany({
    where,
    orderBy: { ageGroup: "asc" },
  });
  return records.map(mapLesson);
}

export async function getKidsLesson(weekStarting: string, ageGroup: string) {
  const record = await prisma.kidsLesson.findUnique({
    where: { weekStarting_ageGroup: { weekStarting, ageGroup } },
  });
  return record ? mapLesson(record) : null;
}

export async function saveKidsLesson(input: Omit<KidsLesson, "updatedAt">) {
  const record = await prisma.kidsLesson.upsert({
    where: {
      weekStarting_ageGroup: {
        weekStarting: input.weekStarting,
        ageGroup: input.ageGroup,
      },
    },
    create: {
      id: input.id,
      weekStarting: input.weekStarting,
      ageGroup: input.ageGroup,
      title: input.title,
      content: input.content,
      status: input.status,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      createdAt: new Date(input.createdAt),
      updatedAt: new Date(),
    },
    update: {
      title: input.title,
      content: input.content,
      status: input.status,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      updatedAt: new Date(),
    },
  });
  return mapLesson(record);
}
