"use client";

import { useEffect, useMemo, useState } from "react";
import { useOnAppRefresh } from "@/hooks/useOnAppRefresh";
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
  /** Hide the entire section when there are no polls (no empty-state message). */
  hideWhenEmpty?: boolean;
  /** Community feed: only polls with no targetGroupId (not ministry/group polls). */
  churchWideOnly?: boolean;
};

export function PollsSection({
  initialPolls = [],
  groupId,
  groupName,
  title = "Polls",
  compact = false,
  showComposer,
  hideWhenEmpty = false,
  churchWideOnly = false,
}: PollsSectionProps) {
  const { user, permissions } = useAuth();
  const [polls, setPolls] = useState<PollView[]>(initialPolls);
  const [loading, setLoading] = useState(false);

  const canCreate = useMemo(() => {
    if (showComposer !== undefined) return showComposer;
    if (groupId) return false;
    return permissions.canManageAdmin;
  }, [showComposer, groupId, permissions.canManageAdmin]);

  function filterForScope(list: PollView[]) {
    if (groupId) return list;
    if (churchWideOnly) return list.filter((poll) => !poll.targetGroupId);
    return list;
  }

  async function refresh() {
    setLoading(true);
    const params = new URLSearchParams();
    if (groupId) params.set("groupId", groupId);
    else if (churchWideOnly) params.set("churchWide", "1");
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/polls${query}`);
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setPolls(filterForScope(data.polls ?? []));
    }
  }

  useEffect(() => {
    setPolls(filterForScope(initialPolls));
    if (!initialPolls.length) {
      void refresh();
    }
  }, [groupId, churchWideOnly]);

  useOnAppRefresh(() => {
    void refresh();
  });

  const scopeLabel = groupName ? `${groupName} members` : "the church";

  if (hideWhenEmpty && (loading || polls.length === 0)) {
    return null;
  }

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
        <p className="rounded-2xl bg-sand-50 px-4 py-5 text-sm text-night-600 dark:bg-night-900/40 dark:text-sand-300">
          {groupId
            ? "No group polls yet. Leaders can create one — members will see it in Polls and group chat."
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
