import type { UrgentAlert } from "@/lib/urgent-alert-types";

/** Max announcement slides on the home carousel at once. */
export const URGENT_ALERT_HOME_CAROUSEL_MAX = 5;

export function limitUrgentAlertsForHomeCarousel<T extends UrgentAlert>(alerts: T[]) {
  return alerts.slice(0, URGENT_ALERT_HOME_CAROUSEL_MAX);
}

export function isUrgentAlertVisibleOnHome(
  alert: Pick<UrgentAlert, "active" | "startsAt" | "expiresAt">,
  now = new Date(),
) {
  if (!alert.active) return false;
  if (alert.startsAt && new Date(alert.startsAt) > now) return false;
  if (alert.expiresAt && new Date(alert.expiresAt) <= now) return false;
  return true;
}

/** Detail page and share links — active and not expired (scheduled OK). */
export function isUrgentAlertPubliclyViewable(
  alert: Pick<UrgentAlert, "active" | "expiresAt">,
  now = new Date(),
) {
  if (!alert.active) return false;
  if (alert.expiresAt && new Date(alert.expiresAt) <= now) return false;
  return true;
}

export type UrgentAlertHomeStatus = "inactive" | "scheduled" | "live" | "expired";

export function urgentAlertHomeStatus(
  alert: Pick<UrgentAlert, "active" | "startsAt" | "expiresAt"> | null,
  now = new Date(),
): UrgentAlertHomeStatus {
  if (!alert?.active) return "inactive";
  if (alert.expiresAt && new Date(alert.expiresAt) <= now) return "expired";
  if (alert.startsAt && new Date(alert.startsAt) > now) return "scheduled";
  return "live";
}

export function urgentAlertAdminHomeMessage(
  alert: Pick<UrgentAlert, "active" | "startsAt" | "expiresAt"> | null,
  now = new Date(),
) {
  const status = urgentAlertHomeStatus(alert, now);
  if (status === "inactive") {
    return "Nothing is flagged active. Publish to turn on the home banner.";
  }
  if (status === "expired") {
    const end = formatUrgentAlertDateTime(alert?.expiresAt);
    return end
      ? `This alert expired ${end} and is hidden from home. Extend the end date and update.`
      : "This alert is expired and hidden from home.";
  }
  if (status === "scheduled") {
    const start = formatUrgentAlertDateTime(alert?.startsAt);
    return start
      ? `Scheduled — the home banner starts ${start}. Leave start blank (or set a past time) to show immediately.`
      : "Scheduled for a future start time — not on home yet.";
  }
  return "Live on the home page now.";
}

export function formatUrgentAlertDateTime(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function urgentAlertScheduleLabel(alert: Pick<UrgentAlert, "startsAt" | "expiresAt">) {
  const start = formatUrgentAlertDateTime(alert.startsAt);
  const end = formatUrgentAlertDateTime(alert.expiresAt);

  if (start && end) return `Showing ${start} – ${end}`;
  if (end) return `Showing until ${end}`;
  if (start) return `Starts ${start}`;
  return null;
}

export function urgentAlertShareMessage(alert: Pick<UrgentAlert, "title" | "message">, url: string) {
  const lines = [`URGENT — Shanah City: ${alert.title}`, "", alert.message.trim(), "", url];
  return lines.join("\n");
}

export function whatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function smsShareUrl(text: string) {
  return `sms:?&body=${encodeURIComponent(text)}`;
}

export function urgentAlertPublicShareBlurb() {
  return "Open in any browser — no Shanah City app or sign-in required.";
}
