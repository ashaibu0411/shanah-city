import { worshipTimeLabel } from "@/lib/worship-types";

export type ChoirServiceProgram = "glory-encounter" | "sunday-service" | "special-program";

export type ChoirAssignmentRole =
  | "worship"
  | "praise"
  | "praise-worship"
  | "ministration-song";

export type ChoirScheduleAssignment = {
  role: ChoirAssignmentRole;
  personName: string;
};

export type ChoirServiceScheduleEntry = {
  id: string;
  serviceDate: string;
  serviceTime: string;
  program: ChoirServiceProgram;
  assignments: ChoirScheduleAssignment[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByName?: string;
};

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

export function choirServiceProgramLabel(program: ChoirServiceProgram) {
  return CHOIR_SERVICE_PROGRAMS.find((item) => item.value === program)?.label ?? program;
}

export function choirAssignmentRoleLabel(role: ChoirAssignmentRole) {
  return CHOIR_ASSIGNMENT_ROLES.find((item) => item.value === role)?.label ?? role;
}

export function normalizeChoirScheduleEntry(
  entry: Partial<ChoirServiceScheduleEntry> & {
    leadRole?: "worship" | "praise" | "both";
    worshipLeaderName?: string;
    praiseLeaderName?: string;
    ministration?: boolean;
    ministrationBy?: string;
  },
): ChoirServiceScheduleEntry {
  if (entry.assignments && entry.assignments.length > 0) {
    return entry as ChoirServiceScheduleEntry;
  }

  const assignments: ChoirScheduleAssignment[] = [];
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

export function formatChoirSchedulePreview(entry: ChoirServiceScheduleEntry) {
  const time = worshipTimeLabel(entry.serviceTime) || entry.serviceTime;
  const lines: string[] = [`${choirServiceProgramLabel(entry.program)} · ${time}`];

  for (const assignment of entry.assignments) {
    if (!assignment.personName.trim()) continue;
    lines.push(`${assignment.personName.trim()} — ${choirAssignmentRoleLabel(assignment.role)}`);
  }

  return lines.join("\n");
}

/** Month grid: names and roles (program is in the event title). */
export function formatChoirScheduleCalendarPreview(entry: ChoirServiceScheduleEntry) {
  const time = worshipTimeLabel(entry.serviceTime) || entry.serviceTime;
  const lines: string[] = [time];

  for (const assignment of entry.assignments) {
    if (!assignment.personName.trim()) continue;
    lines.push(`${assignment.personName.trim()} — ${choirAssignmentRoleLabel(assignment.role)}`);
  }

  return lines.join("\n");
}

export function choirScheduleCalendarEventId(entryId: string) {
  return `choir-schedule-${entryId}`;
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
