"use client";

import { useEffect, useState } from "react";
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

const REPORT_SECTIONS = [
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
  {
    id: "leaders",
    label: "Leader reports",
    description: "Monthly ministry accountability submissions and pastoral follow-up.",
  },
] as const;

type ReportSectionId = (typeof REPORT_SECTIONS)[number]["id"];

function isReportSection(value: string | null): value is ReportSectionId {
  return REPORT_SECTIONS.some((section) => section.id === value);
}

export function AdminReportsHub() {
  const { permissions } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const sectionParam = searchParams.get("section");
  const activeSection: ReportSectionId = isReportSection(sectionParam)
    ? sectionParam
    : "morning";

  useEffect(() => {
    if (!permissions.canManageAdmin) return;
    fetch("/api/meetings")
      .then((response) => response.json())
      .then((data) => setMeetings(data.meetings ?? []))
      .catch(() => undefined);
  }, [permissions.canManageAdmin]);

  function selectSection(sectionId: ReportSectionId) {
    router.replace(`/admin/reports?section=${sectionId}`, { scroll: false });
  }

  if (!permissions.canManageAdmin) {
    return (
      <Card className="p-6">
        <p className="text-night-700">
          Reports are available to Admin Group members only.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
          Admin Group
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-night-900 sm:text-2xl">
          Reports
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-night-600">
          Prayer join clicks and monthly leader accountability in one place. Choose a category
          below.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {REPORT_SECTIONS.map((section) => {
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
      </Card>

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
