"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupIconEditor } from "@/components/groups/GroupIconEditor";
import { GroupMemberAddForm } from "@/components/groups/GroupMemberAddForm";
import { GroupRosterEditor } from "@/components/groups/GroupRosterEditor";
import {
  GroupPremiumSectionLabel,
  GroupPremiumStackCard,
} from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import { ExternalLink } from "@/components/ui";
import { getCampus } from "@/lib/site";
import { remainingAdminCount } from "@/lib/group-admin-utils";
import { groupUsesServiceRoster } from "@/lib/group-roster-types";
import { groupRequiresMinistryReadiness } from "@/lib/ministry-readiness-types";
import type { GroupDetail, GroupMemberPreview } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";

function memberRoleLabel(member: GroupMemberPreview) {
  if (member.isCreator && member.isAdmin) return "Creator · Leader";
  if (member.isCreator) return "Creator";
  if (member.isAdmin) return "Leader";
  if (member.isAssistantLeader) return "Assistant leader";
  return "Member";
}

function formatCreated(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type GroupManagePanelProps = {
  detail: GroupDetail;
  userId: string;
  busy: boolean;
  canManageMembers: boolean;
  canManageLeadership: boolean;
  showLeaderReport: boolean;
  rosterDate?: string;
  rosterTime?: string;
  scrollToMembers?: boolean;
  scrollToInvite?: boolean;
  scrollToRoster?: boolean;
  onDetailChange: (group: GroupDetail) => void;
  onStatus: (message: string, isError?: boolean) => void;
  onRefresh: () => Promise<void>;
  runAction: (body: Record<string, unknown>) => Promise<boolean>;
};

export function GroupManagePanel({
  detail,
  userId,
  busy,
  canManageMembers,
  canManageLeadership,
  showLeaderReport,
  rosterDate,
  rosterTime,
  scrollToMembers,
  scrollToInvite,
  scrollToRoster,
  onDetailChange,
  onStatus,
  onRefresh,
  runAction,
}: GroupManagePanelProps) {
  const router = useRouter();
  const membersRef = useRef<HTMLDivElement>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  const [rosterRefreshKey, setRosterRefreshKey] = useState(0);
  const [readinessCompletions, setReadinessCompletions] = useState<
    Array<{ userName: string; agreedAt: string; score: number; totalQuestions: number }>
  >([]);
  const showRosterEditor = groupUsesServiceRoster(detail) && canManageMembers;
  const showReadinessSection = groupRequiresMinistryReadiness(detail);

  useEffect(() => {
    if (!showReadinessSection || !canManageMembers) return;
    fetch(`/api/groups/readiness?groupId=${encodeURIComponent(detail.id)}&list=1`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setReadinessCompletions(data?.completions ?? []))
      .catch(() => setReadinessCompletions([]));
  }, [detail.id, showReadinessSection, canManageMembers]);

  useEffect(() => {
    if (scrollToMembers) {
      requestAnimationFrame(() => {
        membersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [scrollToMembers]);

  useEffect(() => {
    if (scrollToInvite) {
      requestAnimationFrame(() => {
        document.getElementById("group-member-add")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [scrollToInvite]);

  useEffect(() => {
    if (scrollToRoster) {
      requestAnimationFrame(() => {
        rosterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [scrollToRoster]);

  return (
    <>
      {showReadinessSection ? (
        <GroupPremiumStackCard>
      <GroupPremiumSectionLabel>New volunteer training</GroupPremiumSectionLabel>
      <p className={`${groupsPremium.cardMeta} mt-2`}>
        Members who joined through the app and completed Before You Serve for this team.
      </p>
          {readinessCompletions.length === 0 ? (
            <p className="mt-3 text-sm text-night-500">No completions yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {readinessCompletions.map((entry) => (
                <div key={`${entry.userName}-${entry.agreedAt}`} className={groupsPremium.rowInset}>
                  <div>
                    <p className="text-sm font-medium text-night-900">{entry.userName}</p>
                    <p className="text-xs text-night-500">
                      {new Date(entry.agreedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={groupsPremium.statusChip}>
                    {entry.score}/{entry.totalQuestions} correct
                  </span>
                </div>
              ))}
            </div>
          )}
        </GroupPremiumStackCard>
      ) : null}

      <GroupPremiumStackCard>
        <GroupPremiumSectionLabel>Group settings</GroupPremiumSectionLabel>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={groupsPremium.statusChip}>{groupCategoryLabels[detail.category]}</span>
          <span className={groupsPremium.statusChip}>
            {detail.members.length} member{detail.members.length === 1 ? "" : "s"}
          </span>
        </div>
        {detail.campusId ? (
          <p className={`${groupsPremium.cardMeta} mt-2`}>{getCampus(detail.campusId).name}</p>
        ) : null}

        <div className="mt-4">
          <GroupIconEditor
            group={detail}
            canManage={canManageLeadership}
            onUpdated={onDetailChange}
            onStatus={onStatus}
          />
        </div>

        {detail.description ? (
          <p className="mt-4 text-sm leading-relaxed text-night-700">{detail.description}</p>
        ) : null}

        <p className="mt-4 rounded-2xl bg-sand-50/80 px-3.5 py-3 text-xs text-night-600 ring-1 ring-night-900/8 dark:bg-[var(--color-bg-muted)] dark:text-sand-300 dark:ring-white/10">
          {showLeaderReport
            ? "Add members below, publish service rosters, and submit the Report tab each month."
            : "Add members, assign leaders, and publish service rosters from this tab."}
        </p>
      </GroupPremiumStackCard>

      {showRosterEditor ? (
        <div ref={rosterRef} id="group-roster-editor" className="scroll-mt-24">
          <GroupRosterEditor
            key={rosterRefreshKey}
            groupId={detail.id}
            canManage
            initialDate={rosterDate}
            initialTime={rosterTime}
            onUpdated={() => setRosterRefreshKey((value) => value + 1)}
          />
        </div>
      ) : null}

      {(detail.meetingSchedule || detail.meetingLink) && (
        <GroupPremiumStackCard>
          <GroupPremiumSectionLabel>Meeting details</GroupPremiumSectionLabel>
          <div className="mt-3 space-y-2">
            {detail.meetingSchedule ? (
              <div className={groupsPremium.rowInset}>
                <span className="text-sm font-semibold text-night-800">When</span>
                <span className="text-sm text-night-700">{detail.meetingSchedule}</span>
              </div>
            ) : null}
            {detail.meetingLink ? (
              <div className={groupsPremium.rowInset}>
                <span className="text-sm font-semibold text-night-800">Link</span>
                <ExternalLink
                  href={detail.meetingLink}
                  className="text-sm font-semibold text-night-900 underline"
                >
                  Open meeting link
                </ExternalLink>
              </div>
            ) : null}
          </div>
        </GroupPremiumStackCard>
      )}

      <div ref={membersRef} id="group-members" className="scroll-mt-24">
        <GroupPremiumStackCard>
          <GroupPremiumSectionLabel>
            Members ({detail.members.length})
          </GroupPremiumSectionLabel>

          {canManageMembers ? (
            <div id="group-member-add" className="mt-4">
              <GroupMemberAddForm
                groupId={detail.id}
                disabled={busy}
                onAdded={async () => {
                  await onRefresh();
                }}
                onStatus={onStatus}
              />
            </div>
          ) : null}

          {detail.members.length === 0 ? (
            <p className="mt-3 text-sm text-night-500">No members to show yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {detail.members.map((member) => {
                const canManageMember = canManageMembers && member.id !== userId;
                const leadersAfterChange = remainingAdminCount(detail, member.id);
                const canPromoteLeader =
                  canManageLeadership &&
                  canManageMember &&
                  !member.isAdmin &&
                  !member.isAssistantLeader;
                const canPromoteAssistant =
                  canManageLeadership &&
                  canManageMember &&
                  !member.isAdmin &&
                  !member.isAssistantLeader;
                const canDemoteLeader =
                  canManageLeadership &&
                  canManageMember &&
                  member.isAdmin &&
                  leadersAfterChange >= 1;
                const canDemoteAssistant =
                  canManageLeadership && canManageMember && member.isAssistantLeader;
                const canRemoveRegular =
                  canManageMember && !member.isAdmin && !member.isAssistantLeader;
                const canRemoveLeader =
                  canManageLeadership &&
                  canManageMember &&
                  member.isAdmin &&
                  leadersAfterChange >= 1;

                const canRequireTraining =
                  showReadinessSection &&
                  canManageMember &&
                  !member.trainingRequired &&
                  !member.isAdmin &&
                  !member.isAssistantLeader;

                return (
                  <div key={member.id} className={`${groupsPremium.rowInset} flex-wrap`}>
                    <div>
                      <p className="text-sm font-medium text-night-900">{member.name}</p>
                      <p className="text-xs text-night-500">
                        {getCampus(member.campusId).city} · {memberRoleLabel(member)}
                        {member.trainingRequired ? " · Training pending" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canManageMember &&
                      (canPromoteLeader ||
                        canPromoteAssistant ||
                        canDemoteLeader ||
                        canDemoteAssistant ||
                        canRequireTraining ||
                        canRemoveRegular ||
                        canRemoveLeader) ? (
                        <div className="flex flex-wrap gap-2">
                          {canPromoteLeader ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                const ok = await runAction({
                                  action: "promote-admin",
                                  groupId: detail.id,
                                  memberId: member.id,
                                });
                                if (ok) onStatus(`Made ${member.name} a group leader.`);
                              }}
                              className="text-xs font-semibold text-night-800 underline"
                            >
                              Make leader
                            </button>
                          ) : null}
                          {canPromoteAssistant ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                const ok = await runAction({
                                  action: "promote-assistant",
                                  groupId: detail.id,
                                  memberId: member.id,
                                });
                                if (ok) onStatus(`Made ${member.name} an assistant leader.`);
                              }}
                              className="text-xs font-semibold text-night-800 underline"
                            >
                              Make assistant
                            </button>
                          ) : null}
                          {canDemoteLeader ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    `Remove ${member.name}'s leader role in this group?`,
                                  )
                                ) {
                                  return;
                                }
                                const ok = await runAction({
                                  action: "demote-admin",
                                  groupId: detail.id,
                                  memberId: member.id,
                                });
                                if (ok) onStatus(`Removed ${member.name} as group leader.`);
                              }}
                              className="text-xs font-semibold text-night-700 underline"
                            >
                              Remove leader role
                            </button>
                          ) : null}
                          {canDemoteAssistant ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                const ok = await runAction({
                                  action: "demote-assistant",
                                  groupId: detail.id,
                                  memberId: member.id,
                                });
                                if (ok) onStatus(`Removed ${member.name} as assistant leader.`);
                              }}
                              className="text-xs font-semibold text-night-700 underline"
                            >
                              Remove assistant role
                            </button>
                          ) : null}
                          {canRequireTraining ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    `Assign Before You Serve training to ${member.name}? They will stay on the roster but cannot use group features until they pass the quiz.`,
                                  )
                                ) {
                                  return;
                                }
                                const ok = await runAction({
                                  action: "require-training",
                                  groupId: detail.id,
                                  memberId: member.id,
                                });
                                if (ok) {
                                  onStatus(
                                    `${member.name} must complete Before You Serve before group access is restored.`,
                                  );
                                }
                              }}
                              className="text-xs font-semibold text-clay-700 underline"
                            >
                              Require training
                            </button>
                          ) : null}
                          {canRemoveRegular || canRemoveLeader ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                if (!window.confirm(`Remove ${member.name} from this group?`)) {
                                  return;
                                }
                                const ok = await runAction({
                                  action: "remove-member",
                                  groupId: detail.id,
                                  memberId: member.id,
                                });
                                if (ok) onStatus(`Removed ${member.name} from ${detail.name}.`);
                              }}
                              className="text-xs font-semibold text-red-700 underline"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GroupPremiumStackCard>
      </div>

      <GroupPremiumStackCard>
        <p className="text-xs text-night-400">Created {formatCreated(detail.createdAt)}</p>

        {detail.isAdmin ? (
          <div className="mt-4 border-t border-night-900/8 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm(`Delete "${detail.name}"? This cannot be undone.`)) {
                  return;
                }
                const ok = await runAction({ action: "delete", groupId: detail.id });
                if (ok) {
                  router.push("/groups");
                }
              }}
              className="text-sm font-semibold text-red-700 underline"
            >
              Delete group
            </button>
          </div>
        ) : null}
      </GroupPremiumStackCard>
    </>
  );
}
