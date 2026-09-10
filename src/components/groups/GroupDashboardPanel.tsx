"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GroupPremiumLeaderChip,
  GroupPremiumSectionLabel,
  GroupPremiumStackCard,
} from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import type { GroupDashboardData, GroupDashboardQuickAction } from "@/lib/group-dashboard-types";

type GroupDashboardPanelProps = {
  groupId: string;
  groupName: string;
  memberCount: number;
  leaderNames: string[];
  onQuickAction?: (action: GroupDashboardQuickAction) => void;
  onSetupRoster?: () => void;
};

function AssigneeNames({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-sm text-night-400">Unassigned</span>;
  }
  if (names.length === 1) {
    return <span className="text-sm font-semibold text-night-900">{names[0]}</span>;
  }
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {names.map((name) => (
        <span
          key={name}
          className="rounded-full bg-sand-50 px-2.5 py-0.5 text-xs font-semibold text-night-800 ring-1 ring-night-900/8"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export function GroupDashboardPanel({
  groupId,
  groupName,
  memberCount,
  leaderNames,
  onQuickAction,
  onSetupRoster,
}: GroupDashboardPanelProps) {
  const [dashboard, setDashboard] = useState<GroupDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  function loadDashboard() {
    setLoading(true);
    fetch(`/api/groups/dashboard?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        setDashboard(data.dashboard ?? null);
        setLoading(false);
      })
      .catch(() => {
        setDashboard(null);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDashboard();
  }, [groupId]);

  if (loading) {
    return (
      <GroupPremiumStackCard>
        <p className="text-sm text-night-500">Loading dashboard…</p>
      </GroupPremiumStackCard>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <>
      <GroupPremiumStackCard>
        <p className={groupsPremium.cardTitle}>{groupName}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {leaderNames.length > 0 ? (
            <span className={groupsPremium.statusChip}>Leaders assigned</span>
          ) : null}
          <span className={`${groupsPremium.cardMeta} ml-auto`}>
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </span>
        </div>
        {leaderNames.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-semibold tracking-tight text-night-600">Leaders</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {leaderNames.map((name) => (
                <GroupPremiumLeaderChip key={name} name={name} />
              ))}
            </div>
          </div>
        ) : null}
      </GroupPremiumStackCard>

      {dashboard.nextService ? (
        <div>
          <GroupPremiumSectionLabel className="mb-2 px-0.5">Next service</GroupPremiumSectionLabel>
          <GroupPremiumStackCard>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className={groupsPremium.cardTitle}>{dashboard.nextService.title}</p>
                {dashboard.nextService.subtitle ? (
                  <p className={`${groupsPremium.cardMeta} mt-1`}>{dashboard.nextService.subtitle}</p>
                ) : null}
              </div>
              {dashboard.nextService.href ? (
                <Link
                  href={dashboard.nextService.href}
                  className="text-xs font-semibold text-night-700 underline"
                >
                  Open
                </Link>
              ) : null}
            </div>

            {dashboard.nextService.roles.length > 0 ? (
              <div className="mt-4 space-y-2">
                {dashboard.nextService.roles.map((row) => (
                  <div key={row.roleLabel} className={groupsPremium.rowInset}>
                    <span className="text-sm font-semibold text-night-800">{row.roleLabel}</span>
                    <AssigneeNames names={row.assignees} />
                  </div>
                ))}
              </div>
            ) : dashboard.nextService.emptyMessage ? (
              <div className="mt-4 space-y-3">
                <p className={groupsPremium.cardMeta}>{dashboard.nextService.emptyMessage}</p>
                {dashboard.canManageRoster && onSetupRoster ? (
                  <button
                    type="button"
                    onClick={onSetupRoster}
                    className="inline-flex rounded-full bg-night-900 px-4 py-2 text-xs font-bold text-white"
                  >
                    Set up this Sunday&apos;s roster
                  </button>
                ) : null}
              </div>
            ) : null}
          </GroupPremiumStackCard>
        </div>
      ) : null}

      <div>
        <GroupPremiumSectionLabel className="mb-2 px-0.5">My assignments</GroupPremiumSectionLabel>
        <GroupPremiumStackCard>
          {dashboard.myAssignments.length === 0 ? (
            <p className={groupsPremium.cardMeta}>
              {dashboard.canManageRoster
                ? "No assignments for you yet. Open Manage to publish the team roster."
                : "No upcoming assignments yet. Check back after your leader publishes the service roster."}
            </p>
          ) : (
            <div className="space-y-2">
              {dashboard.myAssignments.map((assignment) => (
                <div key={assignment.id} className={groupsPremium.rowInset}>
                  {assignment.href ? (
                    <Link href={assignment.href} className="min-w-0 flex-1 text-sm font-semibold text-night-900">
                      {assignment.leftLabel}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 text-sm font-semibold text-night-900">
                      {assignment.leftLabel}
                    </span>
                  )}
                  <span className={groupsPremium.statusChip}>{assignment.rightLabel}</span>
                </div>
              ))}
            </div>
          )}
        </GroupPremiumStackCard>
      </div>

      {dashboard.quickActions.length > 0 ? (
        <div>
          <GroupPremiumSectionLabel className="mb-2 px-0.5">Quick actions</GroupPremiumSectionLabel>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {dashboard.quickActions.map((action) =>
              action.href ? (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`${groupsPremium.quickAction} !flex-none sm:min-w-[8.5rem]`}
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onQuickAction?.(action)}
                  className={`${groupsPremium.quickAction} !flex-none sm:min-w-[8.5rem]`}
                >
                  {action.label}
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
