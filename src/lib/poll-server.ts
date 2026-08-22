import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getMemberGroupIds } from "@/lib/admin-people-server";
import { useDatabase } from "@/lib/use-database";
import {
  canCreateChurchPoll,
  canCreateGroupPoll,
  canManagePoll,
} from "@/lib/poll-access-server";
import type {
  CreatePollInput,
  PollRecord,
  PollStatus,
  PollView,
} from "@/lib/poll-types";
import * as pollDb from "@/lib/stores/poll-db";
import * as pollJson from "@/lib/stores/poll-json";

const store = () => (useDatabase() ? pollDb : pollJson);

function isPollClosed(poll: PollRecord) {
  if (poll.status === "closed") return true;
  if (poll.closesAt && new Date(poll.closesAt).getTime() <= Date.now()) return true;
  return false;
}

async function getAllVotes() {
  const polls = await store().getPolls();
  const votesByPoll = new Map<string, Array<{ optionId: string; userId: string }>>();
  await Promise.all(
    polls.map(async (poll) => {
      const votes = await store().getVotesForPoll(poll.id);
      votesByPoll.set(
        poll.id,
        votes.map((vote) => ({ optionId: vote.optionId, userId: vote.userId })),
      );
    }),
  );
  return votesByPoll;
}

function enrichPoll(
  poll: PollRecord,
  votes: Array<{ optionId: string; userId: string }>,
  viewer: PublicMember | null,
  canManage: boolean,
): PollView {
  const closed = isPollClosed(poll);
  const viewerOptionIds = viewer
    ? votes.filter((vote) => vote.userId === viewer.id).map((vote) => vote.optionId)
    : [];
  const voterIds = new Set(votes.map((vote) => vote.userId));
  const totalVotes = votes.length;
  const options = poll.options.map((option) => {
    const voteCount = votes.filter((vote) => vote.optionId === option.id).length;
    const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    return { ...option, voteCount, percent };
  });

  return {
    ...poll,
    options,
    totalVotes,
    voterCount: voterIds.size,
    viewerOptionIds,
    canVote: Boolean(viewer) && !closed,
    canManage,
    isClosed: closed,
  };
}

export async function getPollsForViewer(viewer: PublicMember | null, groupId?: string) {
  const polls = await store().getPolls();
  let visible = polls;

  if (groupId) {
    visible = polls.filter((poll) => poll.targetGroupId === groupId);
  } else if (!viewer) {
    visible = polls.filter((poll) => !poll.targetGroupId);
  } else if (!(await canManageAsAdmin(viewer))) {
    const groupIds = await getMemberGroupIds(viewer.id);
    visible = polls.filter((poll) => {
      if (!poll.targetGroupId) return true;
      return groupIds.includes(poll.targetGroupId);
    });
  }

  const votesByPoll = await getAllVotes();
  const result: PollView[] = [];
  for (const poll of visible) {
    const votes = votesByPoll.get(poll.id) ?? [];
    const canManage = await canManagePoll(viewer, poll);
    result.push(enrichPoll(poll, votes, viewer, canManage));
  }
  return result;
}

export async function createPollForUser(
  viewer: PublicMember,
  input: Omit<CreatePollInput, "createdBy" | "creatorName">,
) {
  const targetGroupId = input.targetGroupId?.trim() || undefined;
  if (targetGroupId) {
    if (!(await canCreateGroupPoll(viewer, targetGroupId))) {
      throw new Error("Only group leaders can create polls for this group.");
    }
  } else if (!(await canCreateChurchPoll(viewer))) {
    throw new Error("Only Admin Group members can create church-wide polls.");
  }

  const options = input.options.map((label) => label.trim()).filter(Boolean);
  if (options.length < 2) {
    throw new Error("Add at least two options.");
  }
  if (options.length > 8) {
    throw new Error("Polls can have at most eight options.");
  }

  return store().createPoll({
    ...input,
    options,
    createdBy: viewer.id,
    creatorName: viewer.name,
    campusId: input.campusId ?? viewer.campusId,
  });
}

export async function voteOnPoll(
  viewer: PublicMember,
  pollId: string,
  optionIds: string[],
) {
  const polls = await store().getPolls();
  const poll = polls.find((entry) => entry.id === pollId);
  if (!poll) return null;
  if (isPollClosed(poll)) {
    throw new Error("This poll is closed.");
  }

  const visible = await getPollsForViewer(viewer);
  if (!visible.some((entry) => entry.id === pollId)) {
    throw new Error("You cannot vote on this poll.");
  }

  await store().castPollVote({
    pollId,
    optionIds,
    userId: viewer.id,
    userName: viewer.name,
    allowMultiple: poll.allowMultiple,
  });

  const updated = await getPollsForViewer(viewer);
  return updated.find((entry) => entry.id === pollId) ?? null;
}

export async function closePoll(viewer: PublicMember, pollId: string) {
  const polls = await store().getPolls();
  const poll = polls.find((entry) => entry.id === pollId);
  if (!poll) return null;
  if (!(await canManagePoll(viewer, poll))) {
    throw new Error("You cannot close this poll.");
  }
  await store().setPollStatus(pollId, "closed" as PollStatus);
  const updated = await getPollsForViewer(viewer, poll.targetGroupId);
  return updated.find((entry) => entry.id === pollId) ?? null;
}
