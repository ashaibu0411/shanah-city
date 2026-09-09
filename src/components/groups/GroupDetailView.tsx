"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppShell } from "@/components/app/AppShellContext";
import { GroupBandHeader } from "@/components/groups/GroupBandHeader";
import { GroupBandTabs } from "@/components/groups/GroupBandTabs";
import { GroupPremiumStackCard, GroupPremiumSectionLabel } from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import { GroupDashboardPanel } from "@/components/groups/GroupDashboardPanel";
import { GroupInfoPanel } from "@/components/groups/GroupInfoPanel";
import { GroupManagePanel } from "@/components/groups/GroupManagePanel";
import { GroupChatPanel } from "@/components/groups/GroupChatPanel";
import { GroupPollsPanel } from "@/components/groups/GroupPollsPanel";
import { GroupCalendarPanel } from "@/components/calendar/GroupCalendarPanel";
import { LeaderReportForm } from "@/components/ministry-reports/LeaderReportForm";
import { CoupleEnrichmentPanel } from "@/components/groups/CoupleEnrichmentPanel";
import { CoupleMentorPanel } from "@/components/groups/CoupleMentorPanel";
import { CouplePrayerPanel } from "@/components/groups/CouplePrayerPanel";
import { GroupResourcesPanel } from "@/components/groups/GroupResourcesPanel";
import { Button } from "@/components/ui";
import {
  groupHasEmbeddedCalendar,
  SHANAH_POWER_COUPLES_GROUP_ID,
  unavailabilityCalendarGroupForId,
} from "@/lib/church-groups";
import { isReportableMinistryGroup } from "@/lib/ministry-report-types";
import type { GroupDetail } from "@/lib/group-types";
import type { GroupDashboardQuickAction } from "@/lib/group-dashboard-types";

type DetailSection =
  | "overview"
  | "info"
  | "manage"
  | "chat"
  | "polls"
  | "report"
  | "calendar"
  | "resources"
  | "prayer"
  | "mentors"
  | "growth";

type ManageScrollTarget = "members" | "invite" | "roster" | null;

export function GroupDetailView({
  initialGroup,
  initialSection = "overview",
  rosterDate,
  rosterTime,
}: {
  initialGroup: GroupDetail;
  initialSection?: DetailSection;
  rosterDate?: string;
  rosterTime?: string;
}) {
  const router = useRouter();
  const { user, refresh, permissions } = useAuth();
  const { setMessagesImmersive, isMobileApp } = useAppShell();
  const [detail, setDetail] = useState(initialGroup);
  const [detailSection, setDetailSection] = useState<DetailSection>(initialSection);
  const [manageScrollTarget, setManageScrollTarget] = useState<ManageScrollTarget>(
    rosterDate || rosterTime ? "roster" : null,
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    setDetail(initialGroup);
  }, [initialGroup]);

  useEffect(() => {
    setDetailSection(initialSection);
    if (initialSection === "manage" && (rosterDate || rosterTime)) {
      setManageScrollTarget("roster");
    }
  }, [initialSection, initialGroup.id, rosterDate, rosterTime]);

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
  const leaderNames = groupLeaders.map((leader) => leader.name);

  const canManageMembers =
    Boolean(user) &&
    (detail.isAdmin || detail.isAssistantLeader || permissions.canManageAdmin);
  const canManageLeadership =
    Boolean(user) && (detail.isAdmin || permissions.canManageAdmin);
  const isSiteAdminManaging = permissions.canManageAdmin && !detail.isMember;
  const showManageTab = canManageMembers || isSiteAdminManaging;
  const showInfoTab = detail.isMember;

  const detailTabs = useMemo(() => {
    const tabs: { id: DetailSection; label: string }[] = [];

    if (detail.isMember) {
      tabs.push({ id: "overview", label: "Dashboard" });
    }
    if (showInfoTab) {
      tabs.push({ id: "info", label: "Info" });
    }
    if (showManageTab) {
      tabs.push({ id: "manage", label: "Manage" });
    }
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
    if (detail.isMember) {
      tabs.push({ id: "polls", label: "Polls" });
    }

    return tabs;
  }, [
    showEmbeddedCalendar,
    showLeaderReport,
    isPowerCouplesGroup,
    detail.isMember,
    showInfoTab,
    showManageTab,
  ]);

  useEffect(() => {
    if (detailTabs.length === 0) return;
    if (!detailTabs.some((tab) => tab.id === detailSection)) {
      setDetailSection(detailTabs[0].id);
    }
  }, [detailTabs, detailSection]);

  function openManageSection(target: ManageScrollTarget = "members") {
    setManageScrollTarget(target);
    setDetailSection("manage");
  }

  function openInfoSection() {
    setDetailSection("info");
  }

  function handleDashboardQuickAction(action: GroupDashboardQuickAction) {
    if (action.action === "chat") {
      setDetailSection("chat");
      return;
    }
    if (action.action === "calendar") {
      setDetailSection("calendar");
      return;
    }
    if (action.action === "report") {
      setDetailSection("report");
      return;
    }
    if (action.action === "invite") {
      openManageSection("invite");
      return;
    }
    if (action.action === "roster") {
      openManageSection("roster");
    }
  }

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
        Admin access — open Manage to add members and assign a group leader.
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

  const defaultSectionForTabs =
    detailTabs.find((tab) => tab.id === detailSection)?.id ??
    detailTabs[0]?.id ??
    "overview";

  return (
    <div
      className={`${groupsPremium.page} overflow-hidden ${
        isMobileApp ? "-mx-4 -mt-4" : "rounded-[1.5rem] border border-night-900/8 shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
      }`}
    >
      <GroupBandHeader
        group={detail}
        showChatAction={Boolean(detail.isMember && user)}
        onMembersClick={showInfoTab ? openInfoSection : () => openManageSection("members")}
        onInviteClick={canManageMembers ? () => openManageSection("invite") : undefined}
        onChatClick={() => setDetailSection("chat")}
        joinSlot={joinSlot}
      />

      {user && detailTabs.length > 0 ? (
        <GroupBandTabs
          tabs={detailTabs}
          activeId={defaultSectionForTabs}
          onChange={(id) => {
            setDetailSection(id as DetailSection);
            if (id !== "manage") {
              setManageScrollTarget(null);
            }
          }}
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
        ) : detailSection === "overview" && detail.isMember && user ? (
          <GroupDashboardPanel
            groupId={detail.id}
            groupName={detail.name}
            memberCount={detail.members.length}
            leaderNames={leaderNames}
            onQuickAction={handleDashboardQuickAction}
            onSetupRoster={() => openManageSection("roster")}
          />
        ) : detailSection === "info" && showInfoTab && user ? (
          <GroupInfoPanel
            detail={detail}
            leaderNames={leaderNames}
            userId={user.id}
            showMessageActions
          />
        ) : detailSection === "manage" && showManageTab && user ? (
          <GroupManagePanel
            detail={detail}
            userId={user.id}
            busy={busy}
            canManageMembers={canManageMembers}
            canManageLeadership={canManageLeadership}
            showLeaderReport={showLeaderReport}
            rosterDate={rosterDate}
            rosterTime={rosterTime}
            scrollToMembers={manageScrollTarget === "members"}
            scrollToInvite={manageScrollTarget === "invite"}
            scrollToRoster={manageScrollTarget === "roster"}
            onDetailChange={setDetail}
            onStatus={(message, isError) => {
              setStatus(message);
              setStatusIsError(Boolean(isError));
            }}
            onRefresh={async () => {
              await refresh();
              await loadDetail(detail.id);
              router.refresh();
            }}
            runAction={runAction}
          />
        ) : null}

        {status ? (
          <p
            className={`rounded-xl px-3 py-2 text-sm ${
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
