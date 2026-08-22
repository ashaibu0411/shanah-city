export type PollStatus = "open" | "closed";

export type PollOptionRecord = {
  id: string;
  label: string;
  sortOrder: number;
};

export type PollRecord = {
  id: string;
  question: string;
  description?: string;
  createdBy: string;
  creatorName: string;
  campusId?: string;
  targetGroupId?: string;
  targetGroupName?: string;
  status: PollStatus;
  allowMultiple: boolean;
  closesAt?: string;
  createdAt: string;
  options: PollOptionRecord[];
};

export type PollVoteRecord = {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  userName: string;
  votedAt: string;
};

export type PollOptionView = PollOptionRecord & {
  voteCount: number;
  percent: number;
};

export type PollView = Omit<PollRecord, "options"> & {
  options: PollOptionView[];
  totalVotes: number;
  voterCount: number;
  viewerOptionIds: string[];
  canVote: boolean;
  canManage: boolean;
  isClosed: boolean;
};

export type CreatePollInput = {
  question: string;
  description?: string;
  options: string[];
  allowMultiple?: boolean;
  closesAt?: string;
  targetGroupId?: string;
  targetGroupName?: string;
  campusId?: string;
  createdBy: string;
  creatorName: string;
};
