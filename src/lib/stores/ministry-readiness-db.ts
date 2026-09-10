import { prisma } from "@/lib/db";
import type {
  MinistryReadinessCompletion,
  MinistryReadinessKey,
  MinistryReadinessSource,
} from "@/lib/ministry-readiness-types";

function mapRecord(record: {
  id: string;
  userId: string;
  readinessKey: string;
  groupId: string;
  groupName: string;
  score: number;
  totalQuestions: number;
  answers: unknown;
  agreedAt: Date;
  source?: string | null;
  createdAt: Date;
}): MinistryReadinessCompletion {
  return {
    id: record.id,
    userId: record.userId,
    readinessKey: record.readinessKey as MinistryReadinessKey,
    groupId: record.groupId,
    groupName: record.groupName,
    score: record.score,
    totalQuestions: record.totalQuestions,
    answers: (record.answers ?? {}) as Record<string, number>,
    agreedAt: record.agreedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    source: (record.source ?? "self_join") as MinistryReadinessCompletion["source"],
  };
}

export async function getMinistryReadinessCompletion(userId: string, readinessKey: MinistryReadinessKey) {
  const record = await prisma.ministryReadinessCompletion.findUnique({
    where: {
      userId_readinessKey: { userId, readinessKey },
    },
  });
  return record ? mapRecord(record) : null;
}

export async function saveMinistryReadinessCompletion(
  input: Omit<MinistryReadinessCompletion, "id" | "createdAt">,
) {
  const record = await prisma.ministryReadinessCompletion.upsert({
    where: {
      userId_readinessKey: {
        userId: input.userId,
        readinessKey: input.readinessKey,
      },
    },
    create: {
      id: `readiness-${Date.now()}`,
      userId: input.userId,
      readinessKey: input.readinessKey,
      groupId: input.groupId,
      groupName: input.groupName,
      score: input.score,
      totalQuestions: input.totalQuestions,
      answers: input.answers,
      agreedAt: new Date(input.agreedAt),
      source: input.source,
    },
    update: {
      groupId: input.groupId,
      groupName: input.groupName,
      score: input.score,
      totalQuestions: input.totalQuestions,
      answers: input.answers,
      agreedAt: new Date(input.agreedAt),
      source: input.source,
    },
  });
  return mapRecord(record);
}

export async function listMinistryReadinessCompletionsForGroup(
  groupId: string,
  options?: { source?: MinistryReadinessSource },
) {
  const records = await prisma.ministryReadinessCompletion.findMany({
    where: {
      groupId,
      ...(options?.source ? { source: options.source } : {}),
    },
    orderBy: { agreedAt: "desc" },
  });
  return records.map(mapRecord);
}

export async function getMinistryReadinessCompletionForUser(userId: string) {
  const records = await prisma.ministryReadinessCompletion.findMany({
    where: { userId },
  });
  return records.map(mapRecord);
}
