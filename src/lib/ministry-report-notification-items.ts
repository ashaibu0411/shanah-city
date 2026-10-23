import { getPrimaryLeaderMinistryGroups } from "@/lib/ministry-report-access-server";
import { listMinistryReports } from "@/lib/ministry-report-server";
import {
  formatReportMonth,
  previousReportMonth,
  type MinistryReportStatus,
} from "@/lib/ministry-report-types";
import type { AppNotificationItem } from "@/lib/notification-types";

function reportNeedsAction(status: MinistryReportStatus | "missing") {
  return status === "missing" || status === "draft" || status === "returned";
}

export async function getMinistryReportNotificationItems(
  userId: string,
): Promise<AppNotificationItem[]> {
  const leaderGroups = await getPrimaryLeaderMinistryGroups(userId);
  if (leaderGroups.length === 0) return [];

  const reportMonth = previousReportMonth();
  const monthLabel = formatReportMonth(reportMonth);
  const reports = await listMinistryReports({ reportMonth });
  const items: AppNotificationItem[] = [];

  for (const group of leaderGroups) {
    const report = reports.find((entry) => entry.groupId === group.id);
    const status: MinistryReportStatus | "missing" = report?.status ?? "missing";
    if (!reportNeedsAction(status)) continue;

    const returned = status === "returned";
    items.push({
      id: `ministry-report-${reportMonth}-${group.id}`,
      type: "ministry_report",
      title: returned ? "Report returned for edits" : "Ministry report due",
      body: returned
        ? `${group.name} · Update and resubmit your ${monthLabel} report`
        : `${group.name} · Submit your ${monthLabel} monthly report`,
      href: `/groups/${encodeURIComponent(group.id)}?report=1`,
      count: 1,
      at: report?.updatedAt ?? `${reportMonth}-01T12:00:00.000Z`,
      groupId: group.id,
    });
  }

  return items.sort((a, b) => a.title.localeCompare(b.title));
}
