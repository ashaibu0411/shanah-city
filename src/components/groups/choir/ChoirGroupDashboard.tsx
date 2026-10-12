"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChoirHomeDashboard } from "@/lib/choir-dashboard-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { ChoirGroupHeader } from "@/components/groups/choir/ChoirGroupHeader";
import { ChoirSectionTabs } from "@/components/groups/choir/ChoirSectionTabs";
import type { GroupBandTab } from "@/components/groups/GroupBandTabs";
import { ChoirHero } from "@/components/groups/choir/ChoirHero";
import { ChoirNextAssignmentCard } from "@/components/groups/choir/ChoirNextAssignmentCard";
import { ChoirExploreNav } from "@/components/groups/choir/ChoirExploreNav";
import { ChoirQuickActions } from "@/components/groups/choir/ChoirQuickActions";
import { choirCalendarRehearsalsHref } from "@/lib/choir-calendar-links";
import { choirExploreNavItems, choirHomeQuickActionLinks } from "@/lib/choir-home-links";
import { ChoirUpcomingRehearsal } from "@/components/groups/choir/ChoirUpcomingRehearsal";
import { ChoirAnnouncements } from "@/components/groups/choir/ChoirAnnouncements";
import { ChoirPreparationChecklist } from "@/components/groups/choir/ChoirPreparationChecklist";
import { ChoirWordForTeam } from "@/components/groups/choir/ChoirWordForTeam";
import "./choir-premium.css";

type ChoirGroupDashboardProps = {
  groupId: string;
  isLeader: boolean;
  sectionTabs: GroupBandTab[];
  activeSectionId: string;
  onSectionChange: (id: string) => void;
  onOpenChat: () => void;
  onOpenCalendar: () => void;
  onOpenInfo: () => void;
  onOpenManage: () => void;
};

export function ChoirGroupDashboard({
  groupId,
  isLeader,
  sectionTabs,
  activeSectionId,
  onSectionChange,
  onOpenChat,
  onOpenCalendar,
  onOpenInfo,
  onOpenManage,
}: ChoirGroupDashboardProps) {
  const [home, setHome] = useState<ChoirHomeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-home?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.home) {
          setError(data.error ?? "Could not load choir home.");
          setHome(null);
        } else {
          setHome(data.home);
          setChecked(data.home.preparationChecked ?? []);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load choir home.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePreparation(itemId: string, isChecked: boolean) {
    if (!home?.preparationPlanKey) return;
    const response = await fetch("/api/groups/choir-home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "preparation",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        planKey: home.preparationPlanKey,
        itemId,
        checked: isChecked,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setChecked(data.checked ?? []);
    }
  }

  const quickLinks = choirHomeQuickActionLinks(groupId);
  const calendarHref = `/groups/${SHANAH_WORSHIP_GROUP_ID}/calendar`;
  const rehearsalsSeeAllHref = choirCalendarRehearsalsHref(groupId);
  const exploreItems = choirExploreNavItems(groupId, { isLeader });

  if (loading) {
    return (
      <div className="choir-group-home rounded-2xl p-4">
        <p className="text-sm text-[var(--choir-muted)]">Loading worship home…</p>
      </div>
    );
  }

  if (error || !home) {
    return (
      <div className="choir-group-home rounded-2xl p-4">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
      </div>
    );
  }

  return (
    <div className="choir-group-home choir-page-shell space-y-[18px] pb-2">
      <ChoirGroupHeader onChatClick={onOpenChat} />

      {sectionTabs.length > 0 ? (
        <ChoirSectionTabs
          tabs={sectionTabs}
          activeId={activeSectionId}
          onChange={onSectionChange}
        />
      ) : null}

      <ChoirHero />

      <ChoirNextAssignmentCard
        assignment={home.assignment}
        upcomingPreview={home.upcomingServicePreview}
      />

      <ChoirQuickActions
        setlistsHref={quickLinks.setlists}
        myScheduleHref={quickLinks.mySchedule}
        rehearsalRoomHref={home.rehearsalRoomHref}
        worshipTeamHref={quickLinks.worshipTeam}
        worshipAcademyHref={quickLinks.worshipAcademy}
        teamConnectHref={quickLinks.teamConnect}
      />

      <ChoirExploreNav items={exploreItems} />

      {isLeader ? (
        <button
          type="button"
          onClick={onOpenManage}
          className="choir-card w-full px-4 py-3 text-left text-sm font-semibold text-[var(--choir-gold-dark)]"
        >
          Manage worship team →
        </button>
      ) : null}

      <ChoirUpcomingRehearsal
        rehearsal={home.rehearsal}
        calendarHref={rehearsalsSeeAllHref}
        canManageSchedule={home.canManageSchedule}
        onManageSchedule={onOpenCalendar}
      />

      <ChoirAnnouncements items={home.announcements} />

      <ChoirPreparationChecklist
        planKey={home.preparationPlanKey}
        checked={checked}
        onChange={updatePreparation}
      />

      <ChoirWordForTeam />
    </div>
  );
}
