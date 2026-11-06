import { WORSHIP_GROUP_ID } from "@/lib/worship-types";

/** Department keys for future expansion — only `worship` is active in pilot. */
export const TEMPERAMENT_DEPARTMENT_KEYS = ["worship"] as const;
export type TemperamentDepartmentKey = (typeof TEMPERAMENT_DEPARTMENT_KEYS)[number];

export type TemperamentDepartmentDef = {
  key: TemperamentDepartmentKey;
  groupId: string;
  label: string;
  /** Pilot: only worship is implemented end-to-end */
  pilotEnabled: boolean;
};

export const TEMPERAMENT_DEPARTMENTS: Record<TemperamentDepartmentKey, TemperamentDepartmentDef> = {
  worship: {
    key: "worship",
    groupId: WORSHIP_GROUP_ID,
    label: "Shanah Worship",
    pilotEnabled: true,
  },
};

export function getDepartmentDef(key: string): TemperamentDepartmentDef | null {
  if (key in TEMPERAMENT_DEPARTMENTS) {
    return TEMPERAMENT_DEPARTMENTS[key as TemperamentDepartmentKey];
  }
  return null;
}
