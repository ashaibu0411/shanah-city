import { prisma } from "@/lib/db";
import type {
  CreatePollInput,
  PollOptionRecord,
  PollRecord,
  PollStatus,
} from "@/lib/poll-types";

function mapPoll(record: {
  id: string;
  question: string;
  description: string | null;
  createdBy: string;
  creatorName: string;
  campusId: string | null;
  targetGroupId: string | null;
  targetGroupName: string | null;
  status: string;
  allowMultiple: boolean;
  closesAt: Date | null;
  createdAt: Date;
  options: { id: string; label: string; sortOrder: number }[];
}): PollRecord {
  return {
    id: record.id,
    question: record.question,
    description: record.description ?? undefined,
    createdBy: record.createdBy,
    creatorName: record.creatorName,
    campusId: record.campusId ?? undefined,
    targetGroupId: record.targetGroupId ?? undefined,
    targetGroupName: record.targetGroupName ?? undefined,
    status: record.status as PollStatus,
    allowMultiple: record.allowMultiple,
    closesAt: record.closesAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    options: record.options
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (option): PollOptionRecord => ({
          id: option.id,
          label: option.label,
          sortOrder: option.sortOrder,
        }),
      ),
  };
}

export async function getPolls() {
  const records = await prisma.poll.findMany({
    include: { options: true },
    orderBy: { createdAt: "desc" },
  });
  return records.map(mapPoll);
}

export async function createPoll(input: CreatePollInput) {
  const pollId = `poll-${Date.now()}`;
  const record = await prisma.poll.create({
    data: {
      id: pollId,
      question: input.question.trim(),
      description: input.description?.trim() || null,
      createdBy: input.createdBy,
      creatorName: input.creatorName,
      campusId: input.campusId ?? null,
      targetGroupId: input.targetGroupId ?? null,
      targetGroupName: input.targetGroupName ?? null,
      status: "open",
      allowMultiple: Boolean(input.allowMultiple),
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      options: {
        create: input.options.map((label, index) => ({
          id: `${pollId}-opt-${index}`,
          label: label.trim(),
          sortOrder: index,
        })),
      },
    },
    include: { options: true },
  });
  return mapPoll(record);
}

export async function setPollStatus(pollId: string, status: PollStatus) {
  try {
    const record = await prisma.poll.update({
      where: { id: pollId },
      data: { status },
      include: { options: true },
    });
    return mapPoll(record);
  } catch {
    return null;
  }
}

export async function castPollVote(input: {
  pollId: string;
  optionIds: string[];
  userId: string;
  userName: string;
  allowMultiple: boolean;
}) {
  const poll = await prisma.poll.findUnique({
    where: { id: input.pollId },
    include: { options: true },
  });
  if (!poll) return null;

  const validOptionIds = new Set(poll.options.map((option) => option.id));
  let optionIds = input.optionIds.filter((id) => validOptionIds.has(id));
  if (optionIds.length === 0) return null;
  if (!input.allowMultiple && optionIds.length > 1) {
    optionIds = [optionIds[0]];
  }

  await prisma.$transaction(async (tx) => {
    await tx.pollVote.deleteMany({
      where: { pollId: input.pollId, userId: input.userId },
    });
    await tx.pollVote.createMany({
      data: optionIds.map((optionId) => ({
        id: `vote-${input.pollId}-${optionId}-${input.userId}`,
        pollId: input.pollId,
        optionId,
        userId: input.userId,
        userName: input.userName,
      })),
    });
  });

  return mapPoll(poll);
}

export async function getVotesForPoll(pollId: string) {
  return prisma.pollVote.findMany({
    where: { pollId },
    select: {
      id: true,
      pollId: true,
      optionId: true,
      userId: true,
      userName: true,
      votedAt: true,
    },
  });
}
