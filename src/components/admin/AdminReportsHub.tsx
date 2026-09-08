"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminMinistryReportsPanel } from "@/components/admin/AdminMinistryReportsPanel";
import { MeetingClickReport } from "@/components/meetings/MeetingClickReport";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  SHIFT_YOUR_EVENING_ID,
  SHIFT_YOUR_MORNING_ID,
} from "@/lib/meeting-catalog";
import type { Meeting } from "@/lib/types";
import { Card } from "@/components/ui";

const CLICK_REPORT_SECTIONS = [
  {
    id: "morning",
    label: "Shift Your Morning",
    description: "Who clicked to join morning prayer (Mon–Fri, 8am MST).",
    meetingId: SHIFT_YOUR_MORNING_ID,
  },
  {
    id: "evening",
    label: "Shift Your Evening",
    description: "Who clicked to join evening prayer (Tue–Thu, 8pm MST).",
    meetingId: SHIFT_YOUR_EVENING_ID,
  },
] as const;

const LEADER_REPORT_SECTION = {
  id: "leaders",
  label: "Leader reports",
  description: "Monthly ministry accountability submissions and pastoral follow-up.",
} as const;

type ClickReportSectionId = (typeof CLICK_REPORT_SECTIONS)[number]["id"];
type ReportSectionId = ClickReportSectionId | typeof LEADER_REPORT_SECTION.id;

function isReportSection(value: string | null): value is ReportSectionId {
  return (
    CLICK_REPORT_SECTIONS.some((section) => section.id === value) ||
    value === LEADER_REPORT_SECTION.id
  );
}

export function AdminReportsHub() {
  const { permissions } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const canViewClickReports = permissions.canManageAdmin;
  const canViewLeaderReports = permissions.canManageAdmin || permissions.canReviewMinistryReports;

  const sections = useMemo(() => {
    const items: Array<
      | (typeof CLICK_REPORT_SECTIONS)[number]
      | typeof LEADER_REPORT_SECTION
    > = [];
    if (canViewClickReports) {
      items.push(...CLICK_REPORT_SECTIONS);
    }
    if (canViewLeaderReports) {
      items.push(LEADER_REPORT_SECTION);
    }
    return items;
  }, [canViewClickReports, canViewLeaderReports]);

  const sectionParam = searchParams.get("section");
  const defaultSection: ReportSectionId = canViewClickReports
    ? "morning"
    : LEADER_REPORT_SECTION.id;
  const activeSection: ReportSectionId = isReportSection(sectionParam)
    ? sectionParam
    : defaultSection;

  useEffect(() => {
    if (!canViewClickReports) return;
    fetch("/api/meetings")
      .then((response) => response.json())
      .then((data) => setMeetings(data.meetings ?? []))
      .catch(() => undefined);
  }, [canViewClickReports]);

  useEffect(() => {
    if (sections.some((section) => section.id === activeSection)) return;
    router.replace(`/admin/reports?section=${defaultSection}`, { scroll: false });
  }, [activeSection, defaultSection, router, sections]);

  function selectSection(sectionId: ReportSectionId) {
    router.replace(`/admin/reports?section=${sectionId}`, { scroll: false });
  }

  if (!canViewLeaderReports && !canViewClickReports) {
    return (
      <Card className="p-6">
        <p className="text-night-700">
          Reports are available to Admin Group and approved Senior or Associate Pastor members.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sections.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const active = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-night-900 text-sand-50 shadow-sm"
                    : "bg-white text-night-700 ring-1 ring-night-900/10 hover:bg-sand-50"
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {activeSection === "leaders" ? (
        <AdminMinistryReportsPanel embedded />
      ) : activeSection === "morning" ? (
        <MeetingClickReport
          meetings={meetings}
          fixedMeetingId={SHIFT_YOUR_MORNING_ID}
          title="Shift Your Morning"
          description="Who clicked to join morning prayer (Mon–Fri, 8am MST)."
          hideMeetingFilter
        />
      ) : (
        <MeetingClickReport
          meetings={meetings}
          fixedMeetingId={SHIFT_YOUR_EVENING_ID}
          title="Shift Your Evening"
          description="Who clicked to join evening prayer (Tue–Thu, 8pm MST)."
          hideMeetingFilter
        />
      )}
    </div>
  );
}
