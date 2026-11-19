import { prisma } from "@/lib/db";
import { useDatabase } from "@/lib/use-database";
import type { AppNotificationItem } from "@/lib/notification-types";

/**
 * Durable, recipient-specific Vision Center items. The push service is only
 * a delivery channel: an assigned pastor must still see the invitation
 * inside the notification bell even without a registered push token.
 *
 * Reuses persisted VisionAssignment and resend audit events, avoiding a
 * separate notification table or leaking private plan content.
 */
export async function getVisionNotificationItems(
  userId: string,
  since: Date,
): Promise<AppNotificationItem[]> {
  if (!useDatabase()) return [];

  const assignments = await prisma.visionAssignment.findMany({
    where: { userId, plan: { year: 2027 } },
    select: {
      id: true,
      planId: true,
      createdAt: true,
      plan: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (!assignments.length) return [];

  const items: AppNotificationItem[] = [];
  for (const assignment of assignments) {
    if (assignment.createdAt <= since) continue;
    items.push({
      id: `vision-assigned-${assignment.id}`,
      type: "vision",
      title: "2027 Vision Center — Review requested",
      body: assignment.plan.title,
      href: `/leadership/vision/${encodeURIComponent(assignment.planId)}`,
      count: 1,
      at: assignment.createdAt.toISOString(),
    });
  }

  const auditEvents = await prisma.visionAuditEvent.findMany({
    where: {
      planId: { in: [...new Set(assignments.map(assignment => assignment.planId))] },
      action: "pastoral-notification-resent",
      createdAt: { gt: since },
    },
    select: { id: true, planId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  for (const audit of auditEvents) {
    // The audit is plan-scoped; never show it to anyone not assigned.
    if (!assignments.some(assignment => assignment.planId === audit.planId)) continue;
    items.push({
      id: `vision-reminder-${audit.id}`,
      type: "vision",
      title: "2027 Master Vision — Reminder",
      body: "Please review the private vision proposal and share your feedback.",
      href: `/leadership/vision/${encodeURIComponent(audit.planId)}`,
      count: 1,
      at: audit.createdAt.toISOString(),
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
}
