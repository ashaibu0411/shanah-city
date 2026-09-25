import { worshipTimeLabel } from "@/lib/worship-types";

export type ChoirServiceProgram = "glory-encounter" | "sunday-service" | "special-program";

export type ChoirLeadRole = "worship" | "praise" | "both";

export type ChoirServiceScheduleEntry = {
  id: string;
  serviceDate: string;
  serviceTime: string;
  program: ChoirServiceProgram;
  leadRole: ChoirLeadRole;
  worshipLeaderName?: string;
  praiseLeaderName?: string;
  ministration: boolean;
  ministrationBy?: string;
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

export const CHOIR_LEAD_ROLES: { value: ChoirLeadRole; label: string }[] = [
  { value: "worship", label: "Worship" },
  { value: "praise", label: "Praise" },
  { value: "both", label: "Worship & praise" },
];

export function choirServiceProgramLabel(program: ChoirServiceProgram) {
  return CHOIR_SERVICE_PROGRAMS.find((item) => item.value === program)?.label ?? program;
}

export function formatChoirSchedulePreview(entry: ChoirServiceScheduleEntry) {
  const lines: string[] = [];
  const time = worshipTimeLabel(entry.serviceTime) || entry.serviceTime;
  lines.push(`${choirServiceProgramLabel(entry.program)} · ${time}`);

  if (entry.leadRole === "worship" || entry.leadRole === "both") {
    if (entry.worshipLeaderName?.trim()) {
      lines.push(`Worship: ${entry.worshipLeaderName.trim()}`);
    }
  }
  if (entry.leadRole === "praise" || entry.leadRole === "both") {
    if (entry.praiseLeaderName?.trim()) {
      lines.push(`Praise: ${entry.praiseLeaderName.trim()}`);
    }
  }
  if (entry.ministration && entry.ministrationBy?.trim()) {
    lines.push(`Ministration: ${entry.ministrationBy.trim()}`);
  } else if (entry.ministration) {
    lines.push("Ministration: TBD");
  }

  return lines.join("\n");
}

export function choirScheduleCalendarEventId(entryId: string) {
  return `choir-schedule-${entryId}`;
}
