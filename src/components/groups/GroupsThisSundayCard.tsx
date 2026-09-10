"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GroupPremiumSectionLabel,
  GroupPremiumStackCard,
} from "@/components/groups/GroupPremiumUI";
import { groupsPremium } from "@/components/groups/groups-premium";
import type { GroupsThisSundaySummary } from "@/lib/group-dashboard-types";

export function GroupsThisSundayCard() {
  const [summary, setSummary] = useState<GroupsThisSundaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/groups/this-sunday")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setSummary(data?.summary ?? null);
        setLoading(false);
      })
      .catch(() => {
        setSummary(null);
        setLoading(false);
      });
  }, []);

  if (loading || !summary) {
    return null;
  }

  if (summary.assignments.length === 0 && summary.teamServices.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <GroupPremiumSectionLabel className="mb-2 px-0.5">This Sunday</GroupPremiumSectionLabel>
      <GroupPremiumStackCard>
        {summary.assignments.length > 0 ? (
          <div className="space-y-2">
            {summary.assignments.map((assignment) => (
              <Link
                key={`${assignment.groupId}-${assignment.leftLabel}`}
                href={assignment.href}
                className={`${groupsPremium.rowInset} transition hover:bg-white`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-night-900">{assignment.leftLabel}</p>
                  <p className="text-xs text-night-500">{assignment.groupName}</p>
                </div>
                <span className={groupsPremium.statusChip}>{assignment.rightLabel}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={`${groupsPremium.cardMeta} mb-3`}>
            No personal assignments yet. Upcoming team schedules:
          </p>
        )}

        {summary.teamServices.length > 0 ? (
          <div className={`space-y-2 ${summary.assignments.length > 0 ? "mt-3 border-t border-night-900/8 pt-3" : ""}`}>
            {summary.teamServices.map((service) => (
              <Link
                key={service.groupId}
                href={service.href ?? `/groups/${service.groupId}`}
                className={`${groupsPremium.rowInset} transition hover:bg-white`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-night-900">{service.groupName}</p>
                  {service.subtitle ? (
                    <p className="text-xs text-night-500">{service.subtitle}</p>
                  ) : null}
                </div>
                <span className="text-xs font-semibold text-night-700 underline">View</span>
              </Link>
            ))}
          </div>
        ) : null}
      </GroupPremiumStackCard>
    </div>
  );
}
