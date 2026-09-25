import {
  CHURCH_MINISTRY_GROUPS,
  GROUP_CALENDAR_EXCLUDED_IDS,
} from "@/lib/church-groups";

export type GroupScheduleProgramOption = { value: string; label: string };
export type GroupScheduleRoleOption = { value: string; label: string };

export type GroupServiceScheduleConfig = {
  programs: GroupScheduleProgramOption[];
  roles: GroupScheduleRoleOption[];
  /** When true, leaders use service schedule instead of the generic “add event” form. */
  preferScheduleOverManualEvents: boolean;
};

const CHOIR_GROUP_ID = "group-choir";

const CHOIR_CONFIG: GroupServiceScheduleConfig = {
  programs: [
    { value: "glory-encounter", label: "Glory Encounter" },
    { value: "sunday-service", label: "Sunday Service" },
    { value: "special-program", label: "Special Program" },
  ],
  roles: [
    { value: "worship", label: "Worship" },
    { value: "praise", label: "Praise" },
    { value: "praise-worship", label: "Praise & worship" },
    { value: "ministration-song", label: "Ministration song" },
  ],
  preferScheduleOverManualEvents: true,
};

const MINISTRY_DEFAULT_CONFIG: GroupServiceScheduleConfig = {
  programs: [
    { value: "sunday-service", label: "Sunday Service" },
    { value: "special-program", label: "Special Program" },
    { value: "ministry-event", label: "Ministry Event" },
  ],
  roles: [
    { value: "lead", label: "Lead" },
    { value: "assistant", label: "Assistant" },
    { value: "volunteer", label: "Volunteer" },
    { value: "support", label: "Support" },
  ],
  preferScheduleOverManualEvents: false,
};

export function getGroupServiceScheduleConfig(groupId: string): GroupServiceScheduleConfig | null {
  if (GROUP_CALENDAR_EXCLUDED_IDS.has(groupId)) {
    return null;
  }

  if (groupId === CHOIR_GROUP_ID) {
    return CHOIR_CONFIG;
  }

  const seed = CHURCH_MINISTRY_GROUPS.find((group) => group.id === groupId);
  if (!seed) {
    return MINISTRY_DEFAULT_CONFIG;
  }

  if (!["ministry", "choir", "youth"].includes(seed.category)) {
    return null;
  }

  return MINISTRY_DEFAULT_CONFIG;
}

export function groupHasServiceSchedule(groupId: string) {
  return getGroupServiceScheduleConfig(groupId) !== null;
}

export function programLabel(
  config: Pick<GroupServiceScheduleConfig, "programs" | "roles">,
  value: string,
) {
  return config.programs.find((item) => item.value === value)?.label ?? value;
}

export function roleLabel(config: Pick<GroupServiceScheduleConfig, "programs" | "roles">, value: string) {
  return config.roles.find((item) => item.value === value)?.label ?? value;
}

export function parseProgramForGroup(
  config: GroupServiceScheduleConfig,
  value: unknown,
): string | null {
  const program = String(value ?? "").trim();
  if (!program) return null;
  return config.programs.some((item) => item.value === program) ? program : null;
}

export function parseRoleForGroup(config: GroupServiceScheduleConfig, value: unknown): string | null {
  const role = String(value ?? "").trim();
  if (!role) return null;
  return config.roles.some((item) => item.value === role) ? role : null;
}
