import type { GroupServiceScheduleConfig } from "@/lib/group-service-schedule-config";
import { programLabel, roleLabel } from "@/lib/group-service-schedule-config";
import { worshipTimeLabel } from "@/lib/worship-types";

export type ChoirServiceProgram = "glory-encounter" | "sunday-service" | "special-program";

export type ChoirAssignmentRole =
  | "worship"
  | "praise"
  | "praise-worship"
  | "ministration-song";

export type GroupScheduleAssignment = {
  role: string;
  personName: string;
};

/** @deprecated Use GroupScheduleAssignment */
export type ChoirScheduleAssignment = GroupScheduleAssignment;

export type GroupServiceScheduleEntry = {
  id: string;
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  program: string;
  assignments: GroupScheduleAssignment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByName?: string;
};

/** @deprecated Use GroupServiceScheduleEntry */
export type ChoirServiceScheduleEntry = GroupServiceScheduleEntry;

export const CHOIR_SERVICE_PROGRAMS: { value: ChoirServiceProgram; label: string }[] = [
  { value: "glory-encounter", label: "Glory Encounter" },
  { value: "sunday-service", label: "Sunday Service" },
  { value: "special-program", label: "Special Program" },
];

export const CHOIR_ASSIGNMENT_ROLES: { value: ChoirAssignmentRole; label: string }[] = [
  { value: "worship", label: "Worship" },
  { value: "praise", label: "Praise" },
  { value: "praise-worship", label: "Praise & worship" },
  { value: "ministration-song", label: "Ministration song" },
];

export function groupScheduleCalendarEventId(groupId: string, entryId: string) {
  return `group-schedule-${groupId}-${entryId}`;
}

export function legacyChoirScheduleCalendarEventId(entryId: string) {
  return `choir-schedule-${entryId}`;
}

/** @deprecated Use groupScheduleCalendarEventId */
export function choirScheduleCalendarEventId(entryId: string) {
  return legacyChoirScheduleCalendarEventId(entryId);
}

export function normalizeGroupScheduleEntry(
  entry: Partial<GroupServiceScheduleEntry> & {
    leadRole?: "worship" | "praise" | "both";
    worshipLeaderName?: string;
    praiseLeaderName?: string;
    ministration?: boolean;
    ministrationBy?: string;
  },
  defaultGroupId = "group-choir",
): GroupServiceScheduleEntry {
  if (entry.assignments && entry.assignments.length > 0) {
    return {
      ...(entry as GroupServiceScheduleEntry),
      groupId: entry.groupId ?? defaultGroupId,
    };
  }

  const assignments: GroupScheduleAssignment[] = [];
  const legacyRole = entry.leadRole;
  if (legacyRole === "worship" || legacyRole === "both") {
    if (entry.worshipLeaderName?.trim()) {
      assignments.push({ role: "worship", personName: entry.worshipLeaderName.trim() });
    }
  }
  if (legacyRole === "praise" || legacyRole === "both") {
    if (entry.praiseLeaderName?.trim()) {
      assignments.push({ role: "praise", personName: entry.praiseLeaderName.trim() });
    }
  }
  if (entry.ministration && entry.ministrationBy?.trim()) {
    assignments.push({
      role: "ministration-song",
      personName: entry.ministrationBy.trim(),
    });
  }

  return {
    id: entry.id!,
    groupId: entry.groupId ?? defaultGroupId,
    serviceDate: entry.serviceDate!,
    serviceTime: entry.serviceTime!,
    program: entry.program!,
    assignments,
    notes: entry.notes,
    createdAt: entry.createdAt!,
    updatedAt: entry.updatedAt!,
    createdBy: entry.createdBy,
    createdByName: entry.createdByName,
  };
}

/** @deprecated Use normalizeGroupScheduleEntry */
export const normalizeChoirScheduleEntry = normalizeGroupScheduleEntry;

export function formatGroupSchedulePreview(
  entry: GroupServiceScheduleEntry,
  config: Pick<GroupServiceScheduleConfig, "programs" | "roles">,
) {
  const time = worshipTimeLabel(entry.serviceTime) || entry.serviceTime;
  const lines: string[] = [`${programLabel(config, entry.program)} · ${time}`];

  for (const assignment of entry.assignments) {
    if (!assignment.personName.trim()) continue;
    lines.push(
      `${assignment.personName.trim()} — ${roleLabel(config, assignment.role)}`,
    );
  }

  return lines.join("\n");
}

export function formatGroupScheduleCalendarPreview(
  entry: GroupServiceScheduleEntry,
  config: Pick<GroupServiceScheduleConfig, "programs" | "roles">,
) {
  const time = worshipTimeLabel(entry.serviceTime) || entry.serviceTime;
  const lines: string[] = [time];

  for (const assignment of entry.assignments) {
    if (!assignment.personName.trim()) continue;
    lines.push(
      `${assignment.personName.trim()} — ${roleLabel(config, assignment.role)}`,
    );
  }

  return lines.join("\n");
}

/** @deprecated Use formatGroupSchedulePreview with config */
export function formatChoirSchedulePreview(entry: GroupServiceScheduleEntry) {
  const time = worshipTimeLabel(entry.serviceTime) || entry.serviceTime;
  const lines: string[] = [
    `${CHOIR_SERVICE_PROGRAMS.find((p) => p.value === entry.program)?.label ?? entry.program} · ${time}`,
  ];
  for (const assignment of entry.assignments) {
    if (!assignment.personName.trim()) continue;
    const role =
      CHOIR_ASSIGNMENT_ROLES.find((item) => item.value === assignment.role)?.label ??
      assignment.role;
    lines.push(`${assignment.personName.trim()} — ${role}`);
  }
  return lines.join("\n");
}

export function parseChoirAssignmentRole(value: unknown): ChoirAssignmentRole | null {
  if (
    value === "worship" ||
    value === "praise" ||
    value === "praise-worship" ||
    value === "ministration-song"
  ) {
    return value;
  }
  return null;
}

export function isGroupScheduleCalendarEventId(eventId: string) {
  return eventId.startsWith("group-schedule-") || eventId.startsWith("choir-schedule-");
}

export function groupScheduleEntryIdFromEventId(eventId: string, groupId: string) {
  const prefix = `group-schedule-${groupId}-`;
  if (eventId.startsWith(prefix)) {
    return eventId.slice(prefix.length);
  }
  if (eventId.startsWith("choir-schedule-") && groupId === "group-choir") {
    return eventId.slice("choir-schedule-".length);
  }
  return null;
}
