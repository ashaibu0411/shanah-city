import type { UrgentAlert } from "@/lib/urgent-alert-types";

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
