"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PollCard } from "@/components/polls/PollCard";
import { PollComposer } from "@/components/polls/PollComposer";
import type { PollView } from "@/lib/poll-types";
import { SectionTitle } from "@/components/ui";

type PollsSectionProps = {
  initialPolls?: PollView[];
  groupId?: string;
  groupName?: string;
  title?: string;
  compact?: boolean;
  showComposer?: boolean;
};

export function PollsSection({
  initialPolls = [],
  groupId,
  groupName,
  title = "Polls",
  compact = false,
  showComposer,
}: PollsSectionProps) {
  const { user, permissions } = useAuth();
  const [polls, setPolls] = useState<PollView[]>(initialPolls);
  const [loading, setLoading] = useState(false);

  const canCreate = useMemo(() => {
    if (showComposer !== undefined) return showComposer;
    if (groupId) return false;
    return permissions.canManageAdmin;
  }, [showComposer, groupId, permissions.canManageAdmin]);

  async function refresh() {
    setLoading(true);
    const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
    const response = await fetch(`/api/polls${query}`);
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setPolls(data.polls ?? []);
    }
  }

  useEffect(() => {
    if (!initialPolls.length) {
      void refresh();
    }
  }, [groupId]);

  const scopeLabel = groupName ? `${groupName} members` : "the church";

  return (
    <section className={compact ? "space-y-3" : "mb-8 space-y-4"}>
      {!compact ? <SectionTitle title={title} /> : null}
      {compact ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">{title}</p>
      ) : null}

      {canCreate && user ? (
        <PollComposer
          scopeLabel={scopeLabel}
          targetGroupId={groupId}
          targetGroupName={groupName}
          compact={compact}
          onCreated={(poll) => setPolls((current) => [poll, ...current.filter((entry) => entry.id !== poll.id)])}
        />
      ) : null}

      {loading && polls.length === 0 ? (
        <p className="text-sm text-night-500">Loading polls...</p>
      ) : null}

      {polls.length === 0 && !loading ? (
        <p className="rounded-2xl bg-sand-50 px-4 py-5 text-sm text-night-600">
          {groupId
            ? "No group polls yet. Leaders can start one when a decision needs input."
            : "No church polls right now. Admins can create one when the church needs to decide together."}
        </p>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              compact={compact}
              onUpdate={(updated) =>
                setPolls((current) =>
                  current.map((entry) => (entry.id === updated.id ? updated : entry)),
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
