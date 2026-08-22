"use client";

import type { PollView } from "@/lib/poll-types";
import { PollsSection } from "@/components/polls/PollsSection";

type GroupPollsPanelProps = {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  initialPolls?: PollView[];
};

export function GroupPollsPanel({
  groupId,
  groupName,
  isAdmin,
  initialPolls = [],
}: GroupPollsPanelProps) {
  return (
    <PollsSection
      initialPolls={initialPolls}
      groupId={groupId}
      groupName={groupName}
      title="Group polls"
      compact
      showComposer={isAdmin}
    />
  );
}
