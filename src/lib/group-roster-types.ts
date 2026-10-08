import { isMediaGroup } from "@/lib/media-group";
import { KIDS_GROUP_ID } from "@/lib/kids-types";
import { WORSHIP_SERVICE_TIMES, worshipTimeLabel } from "@/lib/worship-types";
import type { GroupCategory } from "@/lib/group-types";

export type GroupRosterSlot = {
  roleLabel: string;
  userId?: string | null;
  name: string;
};

export type GroupServiceRoster = {
  id: string;
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  title?: string | null;
  assignments: GroupRosterSlot[];
  notes?: string | null;
  status: "draft" | "published";
  publishedAt?: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_ROSTER_SERVICE_TIME = "10:00";

/** Sunday service roster — only teams that assign roles per service (not fellowship groups). */
export const GROUP_SERVICE_ROSTER_IDS = new Set<string>([
  KIDS_GROUP_ID,
  "group-ushering",
  "group-choir",
]);

export function groupUsesServiceRoster(group: {
  id: string;
  name: string;
  category: GroupCategory;
}) {
  if (isMediaGroup(group)) return true;
  return GROUP_SERVICE_ROSTER_IDS.has(group.id);
}

export function defaultRosterRolesForGroup(group: {
  id: string;
  name: string;
  category: GroupCategory;
}) {
  if (isMediaGroup(group)) {
    return ["Mac Mini", "Camera", "Audio", "Stream director", "Slides / ProPresenter"];
  }
  if (group.id === "group-ushering") {
    return ["Usher lead", "Usher", "Greeter", "Parking"];
  }
  if (group.category === "youth") {
    return ["Team lead", "Small group host", "Check-in", "Safety"];
  }
  if (group.category === "choir") {
    return ["Worship leader", "Vocals", "Musician", "Tech"];
  }
  return ["Team lead", "Co-lead", "Support"];
}

export function emptySlotsForRoles(roles: string[]): GroupRosterSlot[] {
  return roles.map((roleLabel) => ({ roleLabel, userId: null, name: "" }));
}

export function normalizeRosterSlots(slots: GroupRosterSlot[] | undefined): GroupRosterSlot[] {
  return (slots ?? [])
    .map((slot) => ({
      roleLabel: slot.roleLabel.trim(),
      userId: slot.userId ?? null,
      name: slot.name.trim(),
    }))
    .filter((slot) => slot.roleLabel.length > 0);
}

export function rosterSlotsFromMembers(
  roles: string[],
  members: Array<{ id: string; name: string }>,
  existing?: GroupRosterSlot[],
): GroupRosterSlot[] {
  const existingByRole = new Map((existing ?? []).map((slot) => [slot.roleLabel, slot]));
  const mergedRoles = [...roles];
  for (const slot of existing ?? []) {
    if (!mergedRoles.includes(slot.roleLabel)) {
      mergedRoles.push(slot.roleLabel);
    }
  }

  return mergedRoles.map((roleLabel) => {
    const prior = existingByRole.get(roleLabel);
    if (prior) {
      const member = prior.userId ? members.find((entry) => entry.id === prior.userId) : null;
      return {
        roleLabel,
        userId: prior.userId ?? null,
        name: member?.name ?? prior.name,
      };
    }
    return { roleLabel, userId: null, name: "" };
  });
}

export function nextServiceSundayIso(reference = new Date()) {
  const date = new Date(reference);
  date.setHours(12, 0, 0, 0);
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

export function rosterServiceDateTimeLabel(serviceDate: string, serviceTime: string) {
  const date = new Date(`${serviceDate}T12:00:00`);
  const day = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${worshipTimeLabel(serviceTime)}`;
}

export function rosterServiceTimes() {
  return WORSHIP_SERVICE_TIMES.filter((slot) =>
    ["09:00", "10:00", "11:30"].includes(slot.value),
  );
}

export function rosterRoleRows(slots: GroupRosterSlot[]) {
  return slots
    .filter((slot) => slot.roleLabel.trim())
    .map((slot) => ({
      roleLabel: slot.roleLabel,
      assignees: slot.name.trim() ? [slot.name.trim()] : [],
    }));
}

export function rosterAssignmentsForUser(slots: GroupRosterSlot[], userId: string) {
  return slots.filter((slot) => slot.userId === userId && slot.name.trim());
}

export function cloneRosterSlotsForCopy(slots: GroupRosterSlot[]): GroupRosterSlot[] {
  return normalizeRosterSlots(slots).map((slot) => ({
    roleLabel: slot.roleLabel,
    userId: slot.userId ?? null,
    name: slot.name,
  }));
}
