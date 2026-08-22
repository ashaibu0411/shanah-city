import { promises as fs } from "fs";
import path from "path";
import type {
  CreatePollInput,
  PollRecord,
  PollStatus,
  PollVoteRecord,
} from "@/lib/poll-types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

export async function getPolls() {
  return readJson<PollRecord[]>("polls.json", []);
}

export async function savePolls(polls: PollRecord[]) {
  await writeJson("polls.json", polls);
}

export async function getPollVotes() {
  return readJson<PollVoteRecord[]>("poll-votes.json", []);
}

export async function savePollVotes(votes: PollVoteRecord[]) {
  await writeJson("poll-votes.json", votes);
}

export async function createPoll(input: CreatePollInput) {
  const polls = await getPolls();
  const pollId = `poll-${Date.now()}`;
  const poll: PollRecord = {
    id: pollId,
    question: input.question.trim(),
    description: input.description?.trim() || undefined,
    createdBy: input.createdBy,
    creatorName: input.creatorName,
    campusId: input.campusId,
    targetGroupId: input.targetGroupId,
    targetGroupName: input.targetGroupName,
    status: "open",
    allowMultiple: Boolean(input.allowMultiple),
    closesAt: input.closesAt,
    createdAt: new Date().toISOString(),
    options: input.options.map((label, index) => ({
      id: `${pollId}-opt-${index}`,
      label: label.trim(),
      sortOrder: index,
    })),
  };
  polls.unshift(poll);
  await savePolls(polls);
  return poll;
}

export async function setPollStatus(pollId: string, status: PollStatus) {
  const polls = await getPolls();
  const index = polls.findIndex((poll) => poll.id === pollId);
  if (index === -1) return null;
  polls[index].status = status;
  await savePolls(polls);
  return polls[index];
}

export async function castPollVote(input: {
  pollId: string;
  optionIds: string[];
  userId: string;
  userName: string;
  allowMultiple: boolean;
}) {
  const polls = await getPolls();
  const poll = polls.find((entry) => entry.id === input.pollId);
  if (!poll) return null;

  const validOptionIds = new Set(poll.options.map((option) => option.id));
  const optionIds = input.optionIds.filter((id) => validOptionIds.has(id));
  if (optionIds.length === 0) return null;
  if (!input.allowMultiple && optionIds.length > 1) {
    optionIds.splice(1);
  }

  const votes = await getPollVotes();
  const remaining = votes.filter(
    (vote) => !(vote.pollId === input.pollId && vote.userId === input.userId),
  );

  const now = new Date().toISOString();
  for (const optionId of optionIds) {
    remaining.push({
      id: `vote-${input.pollId}-${optionId}-${input.userId}`,
      pollId: input.pollId,
      optionId,
      userId: input.userId,
      userName: input.userName,
      votedAt: now,
    });
  }

  await savePollVotes(remaining);
  return poll;
}

export async function getVotesForPoll(pollId: string) {
  const votes = await getPollVotes();
  return votes.filter((vote) => vote.pollId === pollId);
}
