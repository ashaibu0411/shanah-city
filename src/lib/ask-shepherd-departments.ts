import { WORSHIP_GROUP_ID } from "@/lib/worship-types";

export const ASK_SHEPHERD_DEPARTMENTS = ["worship"] as const;
export type AskShepherdDepartmentKey = (typeof ASK_SHEPHERD_DEPARTMENTS)[number];

export type AskShepherdDepartmentDef = {
  key: AskShepherdDepartmentKey;
  groupId: string;
  label: string;
  /** Matches TemperamentShepherding department keys for shared context. */
  temperamentDepartmentKey: "worship";
};

export const ASK_SHEPHERD_DEPARTMENT_MAP: Record<AskShepherdDepartmentKey, AskShepherdDepartmentDef> =
  {
    worship: {
      key: "worship",
      groupId: WORSHIP_GROUP_ID,
      label: "Shanah Worship",
      temperamentDepartmentKey: "worship",
    },
  };

export function parseAskShepherdDepartmentKey(value: string): AskShepherdDepartmentDef | null {
  if (value in ASK_SHEPHERD_DEPARTMENT_MAP) {
    return ASK_SHEPHERD_DEPARTMENT_MAP[value as AskShepherdDepartmentKey];
  }
  return null;
}
