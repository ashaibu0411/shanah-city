"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { GroupBandHeader } from "@/components/groups/GroupBandHeader";
import { GroupBandTabs } from "@/components/groups/GroupBandTabs";
import {
  GroupPremiumLeaderChip,
  GroupPremiumSectionLabel,
  GroupPremiumStackCard,
} from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import { GroupIconEditor } from "@/components/groups/GroupIconEditor";
import { GroupChatPanel } from "@/components/groups/GroupChatPanel";
import { GroupMemberAddForm } from "@/components/groups/GroupMemberAddForm";
import { GroupPollsPanel } from "@/components/groups/GroupPollsPanel";
import { GroupCalendarPanel } from "@/components/calendar/GroupCalendarPanel";
import { LeaderReportForm } from "@/components/ministry-reports/LeaderReportForm";
import { Button, ExternalLink } from "@/components/ui";
import {
  groupHasEmbeddedCalendar,
  SHANAH_POWER_COUPLES_GROUP_ID,
  unavailabilityCalendarGroupForId,
} from "@/lib/church-groups";
import { CouplesDevotionBanner } from "@/components/groups/CouplesDevotionBanner";
import { CoupleEnrichmentPanel } from "@/components/groups/CoupleEnrichmentPanel";
import { CoupleMentorPanel } from "@/components/groups/CoupleMentorPanel";
import { CouplePrayerPanel } from "@/components/groups/CouplePrayerPanel";
import { GroupResourcesPanel } from "@/components/groups/GroupResourcesPanel";
import { getCampus } from "@/lib/site";
import { remainingAdminCount } from "@/lib/group-admin-utils";
import { isReportableMinistryGroup } from "@/lib/ministry-report-types";
import type { GroupDetail, GroupMemberPreview } from "@/lib/group-types";
import { groupCategoryLabels } from "@/lib/group-types";

type DetailSection =
  | "overview"
  | "chat"
  | "polls"
  | "report"
  | "calendar"
  | "resources"
  | "prayer"
  | "mentors"
  | "growth";

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function memberRoleLabel(member: GroupMemberPreview) {
  if (member.isCreator && member.isAdmin) return "Creator · Leader";
  if (member.isCreator) return "Creator";
  if (member.isAdmin) return "Leader";
  if (member.isAssistantLeader) return "Assistant leader";
  return "Member";
}

export function GroupDetailView({
  initialGroup,
  initialSection = "overview",
}: {
  initialGroup: GroupDetail;
  initialSection?: DetailSection;
}) {
  const router = useRouter();
  const { user, refresh, permissions } = useAuth();
  const { setMessagesImmersive, isMobileApp } = useAppShell();
  const [detail, setDetail] = useState(initialGroup);
  const [detailSection, setDetailSection] = useState<DetailSection>(initialSection);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const membersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDetail(initialGroup);
  }, [initialGroup]);

  useEffect(() => {
    setDetailSection(initialSection);
  }, [initialSection, initialGroup.id]);

  useEffect(() => {
    const immersive = detailSection === "chat" && detail.isMember && Boolean(user);
    setMessagesImmersive(immersive);
    if (immersive) {
      document.body.dataset.messagesImmersive = "true";
    } else {
      delete document.body.dataset.messagesImmersive;
    }
    return () => {
      setMessagesImmersive(false);
      delete document.body.dataset.messagesImmersive;
    };
  }, [detailSection, detail.isMember, user, setMessagesImmersive]);

  async function loadDetail(groupId: string) {
    const response = await fetch(`/api/groups?id=${encodeURIComponent(groupId)}`);
    const data = await response.json();
    if (response.ok) {
      setDetail(data.group ?? initialGroup);
    } else {
      setStatus(data.error ?? "Could not load group.");
    }
  }

  async function runAction(body: Record<string, unknown>) {
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Something went wrong.");
      setStatusIsError(true);
      return false;
    }

    setStatusIsError(false);

    if (
      body.action === "join" ||
      body.action === "remove-member" ||
      body.action === "add-member"
    ) {
      await refresh();
    }

    const groupId = body.groupId ? String(body.groupId) : detail.id;
    await loadDetail(groupId);
    router.refresh();
    return true;
  }

  const showEmbeddedCalendar =
    detail.isMember && groupHasEmbeddedCalendar(detail);
  const showLeaderReport =
    detail.isAdmin &&
    isReportableMinistryGroup({ id: detail.id, name: detail.name, category: detail.category });
  const isPowerCouplesGroup = detail.id === SHANAH_POWER_COUPLES_GROUP_ID;
  const groupLeaders = useMemo(
    () =>
      detail.members.filter(
        (member) => member.isAdmin || member.isCreator || member.isAssistantLeader,
      ),
    [detail.members],
  );

  const detailTabs = useMemo(() => {
    const tabs: { id: DetailSection; label: string }[] = [{ id: "overview", label: "Dashboard" }];
    if (showLeaderReport) tabs.push({ id: "report", label: "Report" });
    if (showEmbeddedCalendar) tabs.push({ id: "calendar", label: "Events" });
    if (isPowerCouplesGroup && detail.isMember) {
      tabs.push(
        { id: "resources", label: "Resources" },
        { id: "prayer", label: "Prayer" },
        { id: "mentors", label: "Mentors" },
        { id: "growth", label: "Growth" },
      );
    }
    tabs.push({ id: "polls", label: "Polls" }, { id: "chat", label: "Chat" });
    return tabs;
  }, [showEmbeddedCalendar, showLeaderReport, isPowerCouplesGroup, detail.isMember]);

  function openInfoSection(target: "members" | "invite" = "members") {
    setDetailSection("overview");
    requestAnimationFrame(() => {
      if (target === "invite") {
        document.getElementById("group-member-add")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
      membersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  const canManageMembers =
    Boolean(user) &&
    (detail.isAdmin || detail.isAssistantLeader || permissions.canManageAdmin);
  const canManageLeadership =
    Boolean(user) && (detail.isAdmin || permissions.canManageAdmin);
  const isSiteAdminManaging = permissions.canManageAdmin && !detail.isAdmin;

  if (detailSection === "chat" && detail.isMember && user) {
    return (
      <GroupChatPanel
        groupId={detail.id}
        groupName={detail.name}
        groupCategory={detail.category}
        userId={user.id}
        memberCount={detail.members.length}
        onBack={() => setDetailSection("overview")}
      />
    );
  }

  const joinSlot = !user ? (
    <Button href={`/sign-in?next=/groups/${detail.id}`} className="w-full">
      Sign in to join
    </Button>
  ) : !detail.isMember ? (
    isSiteAdminManaging ? (
      <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-900">
        Admin access — open Dashboard to add members and assign a group leader.
      </p>
    ) : (
      <Button
        className="w-full"
        disabled={busy}
        onClick={() =>
          runAction({ action: "join", groupId: detail.id }).then((ok) => {
            if (ok) setStatus(`You joined ${detail.name}.`);
          })
        }
      >
        Join group
      </Button>
    )
  ) : null;

  return (
    <div
      className={`${groupsPremium.page} overflow-hidden ${
        isMobileApp ? "-mx-4 -mt-4" : "rounded-[1.5rem] border border-night-900/8 shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
      }`}
    >
      <GroupBandHeader
        group={detail}
        showChatAction={Boolean(detail.isMember && user)}
        onMembersClick={() => openInfoSection("members")}
        onInviteClick={canManageMembers ? () => openInfoSection("invite") : undefined}
        onChatClick={() => setDetailSection("chat")}
        joinSlot={joinSlot}
      />

      {detail.isMember && user ? (
        <GroupBandTabs
          tabs={detailTabs}
          activeId={detailSection}
          onChange={(id) => setDetailSection(id as DetailSection)}
        />
      ) : isSiteAdminManaging && user ? (
        <GroupBandTabs
          tabs={[{ id: "overview", label: "Dashboard" }]}
          activeId="overview"
          onChange={() => undefined}
        />
      ) : null}

      {!detail.isMember && user && !isSiteAdminManaging ? (
        <div className={groupsPremium.pageInset}>
          <GroupPremiumStackCard>
            <GroupPremiumSectionLabel>About</GroupPremiumSectionLabel>
            <p className="mt-3 text-sm leading-relaxed text-night-700">{detail.description}</p>
          </GroupPremiumStackCard>
        </div>
      ) : null}

      <div className={`${groupsPremium.pageInset} space-y-4`}>
        {detailSection === "polls" && detail.isMember && user ? (
        <GroupPollsPanel groupId={detail.id} groupName={detail.name} isAdmin={detail.isAdmin} />
      ) : detailSection === "report" && showLeaderReport && user ? (
        <LeaderReportForm embedded groupId={detail.id} groupName={detail.name} />
      ) : detailSection === "calendar" && showEmbeddedCalendar && user ? (
        <GroupCalendarPanel
          groupId={detail.id}
          groupLabel={detail.name}
          signInNextUrl={`/groups/${detail.id}?calendar=1`}
          showWorshipPlanner={permissions.canAccessWorshipPlanner}
          unavailabilityGroup={unavailabilityCalendarGroupForId(detail.id)}
        />
      ) : detailSection === "resources" && isPowerCouplesGroup && detail.isMember && user ? (
        <GroupResourcesPanel
          groupId={detail.id}
          isLeader={detail.isAdmin || detail.isAssistantLeader || permissions.canManageAdmin}
        />
      ) : detailSection === "prayer" && isPowerCouplesGroup && detail.isMember && user ? (
        <CouplePrayerPanel />
      ) : detailSection === "mentors" && isPowerCouplesGroup && detail.isMember && user ? (
        <CoupleMentorPanel groupId={detail.id} />
      ) : detailSection === "growth" && isPowerCouplesGroup && detail.isMember && user ? (
        <CoupleEnrichmentPanel groupId={detail.id} />
      ) : detailSection === "overview" && user && (detail.isMember || isSiteAdminManaging) ? (
        <>
          <GroupPremiumStackCard>
            <GroupPremiumSectionLabel>Overview</GroupPremiumSectionLabel>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={groupsPremium.statusChip}>
                {groupCategoryLabels[detail.category]}
              </span>
              <span className={groupsPremium.statusChip}>
                {detail.members.length} member{detail.members.length === 1 ? "" : "s"}
              </span>
              {groupLeaders.length > 0 ? (
                <span className={groupsPremium.statusChip}>Leaders assigned</span>
              ) : null}
            </div>
            {detail.campusId ? (
              <p className={`${groupsPremium.cardMeta} mt-2`}>{getCampus(detail.campusId).name}</p>
            ) : null}

            <div className="mt-4">
              <GroupIconEditor
                group={detail}
                canManage={canManageLeadership}
                onUpdated={(group) => setDetail(group)}
                onStatus={(message, isError) => {
                  setStatus(message);
                  setStatusIsError(Boolean(isError));
                }}
              />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-night-700">{detail.description}</p>

            {groupLeaders.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {groupLeaders.map((leader) => (
                  <GroupPremiumLeaderChip key={leader.id} name={leader.name} />
                ))}
              </div>
            ) : null}

            {detail.isMember && canManageLeadership ? (
              <p className="mt-4 rounded-2xl bg-[#f7f3eb]/80 px-3.5 py-3 text-xs text-night-600 ring-1 ring-night-900/8">
                {showLeaderReport
                  ? "Manage members below. Submit the Report tab each month."
                  : "Leaders can add members and assign assistant leaders below."}
              </p>
            ) : null}

            {detail.id === SHANAH_POWER_COUPLES_GROUP_ID && detail.isMember ? (
              <CouplesDevotionBanner className="mt-4" />
            ) : null}
          </GroupPremiumStackCard>

          {(detail.meetingSchedule || detail.meetingLink) && (
            <GroupPremiumStackCard>
              <GroupPremiumSectionLabel>Next meeting</GroupPremiumSectionLabel>
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
                  await refresh();
                  await loadDetail(detail.id);
                  router.refresh();
                }}
                onStatus={(message, isError) => {
                  setStatus(message);
                  setStatusIsError(Boolean(isError));
                }}
              />
              </div>
            ) : null}

            {detail.members.length === 0 ? (
              <p className="mt-3 text-sm text-night-500">
                {detail.visibility === "private" && !detail.isMember
                  ? "Member list is visible after you join this private group."
                  : "No members to show yet."}
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {detail.members.map((member) => {
                  const canManageMember =
                    canManageMembers && user && member.id !== user.id;
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
                    canManageMember &&
                    !member.isAdmin &&
                    !member.isAssistantLeader;
                  const canRemoveLeader =
                    canManageLeadership &&
                    canManageMember &&
                    member.isAdmin &&
                    leadersAfterChange >= 1;

                  return (
                    <div
                      key={member.id}
                      className={`${groupsPremium.rowInset} flex-wrap`}
                    >
                      <div>
                        <p className="text-sm font-medium text-night-900">{member.name}</p>
                        <p className="text-xs text-night-500">
                          {getCampus(member.campusId).city} · {memberRoleLabel(member)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {detail.isMember && user && member.id !== user.id ? (
                          <Button
                            variant="secondary"
                            href={`/messages?member=${encodeURIComponent(member.id)}&name=${encodeURIComponent(member.name)}`}
                          >
                            Message
                          </Button>
                        ) : null}
                        {canManageMember &&
                        (canPromoteLeader ||
                          canPromoteAssistant ||
                          canDemoteLeader ||
                          canDemoteAssistant ||
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
                                  if (ok) setStatus(`Made ${member.name} a group leader.`);
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
                                  if (ok) {
                                    setStatus(`Made ${member.name} an assistant leader.`);
                                  }
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
                                  if (ok) setStatus(`Removed ${member.name} as group leader.`);
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
                                  if (ok) {
                                    setStatus(`Removed ${member.name} as assistant leader.`);
                                  }
                                }}
                                className="text-xs font-semibold text-night-700 underline"
                              >
                                Remove assistant role
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
                                  if (ok) setStatus(`Removed ${member.name} from ${detail.name}.`);
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
            <p className="text-xs text-night-400">Created {formatTime(detail.createdAt)}</p>

            {detail.isAdmin && user ? (
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
      ) : null}

      {status ? (
        <p
          className={`mt-4 rounded-xl px-3 py-2 text-sm ${
            statusIsError ||
            status.includes("wrong") ||
            status.includes("Could not") ||
            status.includes("must")
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {status}
        </p>
      ) : null}
      </div>
    </div>
  );
}
