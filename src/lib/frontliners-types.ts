import { WORSHIP_SERVICE_TIMES } from "@/lib/worship-types";

export const FRONTLINERS_GROUP_ID = "group-frontliners";

export const USHER_SERVICE_TIMES = WORSHIP_SERVICE_TIMES.filter(
  (slot) => slot.value === "10:00" || slot.value === "09:00" || slot.value === "11:30",
);

export const USHER_ROLES = [
  { value: "lead", label: "Usher lead" },
  { value: "usher", label: "Usher" },
  { value: "greeter", label: "Greeter" },
] as const;

export type UsherRole = (typeof USHER_ROLES)[number]["value"];
export type GuestSubmissionStatus = "new" | "contacted" | "archived";

export type GuestSubmission = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  visitDate?: string | null;
  serviceTime?: string | null;
  isFirstVisit: boolean;
  notes?: string | null;
  status: GuestSubmissionStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
};

export type UsherAssignment = {
  userId: string;
  name: string;
  role: UsherRole;
  ready: boolean;
};

export type UsherSchedule = {
  id: string;
  serviceDate: string;
  serviceTime: string;
  ushers: UsherAssignment[];
  notes?: string | null;
  status: "draft" | "published";
  publishedAt?: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export function usherRoleLabel(role: string) {
  return USHER_ROLES.find((entry) => entry.value === role)?.label ?? role;
}

export function guestStatusLabel(status: GuestSubmissionStatus) {
  if (status === "contacted") return "Contacted";
  if (status === "archived") return "Archived";
  return "New";
}

export function normalizeUshers(ushers: UsherAssignment[] | undefined) {
  return (ushers ?? []).map((usher) => ({
    userId: usher.userId,
    name: usher.name.trim(),
    role: (USHER_ROLES.some((entry) => entry.value === usher.role)
      ? usher.role
      : "usher") as UsherRole,
    ready: Boolean(usher.ready),
  }));
}

export function cloneUsherScheduleContent(
  source: Pick<UsherSchedule, "ushers" | "notes">,
) {
  return {
    ushers: normalizeUshers(source.ushers.map((usher) => ({ ...usher, ready: false }))),
    notes: source.notes?.trim() || undefined,
  };
}

export function nextServiceSundayIso(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function previousSundayIso(serviceDate: string) {
  const date = new Date(`${serviceDate}T12:00:00`);
  date.setDate(date.getDate() - 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function serviceTimeLabel(time: string) {
  return USHER_SERVICE_TIMES.find((entry) => entry.value === time)?.label ?? time;
}

export function serviceDateTimeLabel(serviceDate: string, serviceTime: string) {
  const date = new Date(`${serviceDate}T12:00:00`);
  const day = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${serviceTimeLabel(serviceTime)}`;
}
