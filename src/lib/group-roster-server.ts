import { useDatabase } from "@/lib/use-database";
import * as groupRosterDb from "@/lib/stores/group-roster-db";
import * as groupRosterJson from "@/lib/stores/group-roster-json";

const store = () => (useDatabase() ? groupRosterDb : groupRosterJson);

export const getGroupRosterTemplateRoles = (
  group: Parameters<typeof groupRosterJson.getGroupRosterTemplateRoles>[0],
) => store().getGroupRosterTemplateRoles(group);

export const saveGroupRosterTemplateRoles = (groupId: string, roles: string[]) =>
  store().saveGroupRosterTemplateRoles(groupId, roles);

export const listGroupServiceRosters = (
  options: Parameters<typeof groupRosterJson.listGroupServiceRosters>[0],
) => store().listGroupServiceRosters(options);

export const getGroupServiceRoster = (
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) => store().getGroupServiceRoster(groupId, serviceDate, serviceTime);

export const findPreviousGroupServiceRoster = (
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) => store().findPreviousGroupServiceRoster(groupId, serviceDate, serviceTime);

export const saveGroupServiceRoster = (
  input: Parameters<typeof groupRosterJson.saveGroupServiceRoster>[0],
) => store().saveGroupServiceRoster(input);

export const deleteGroupServiceRoster = (
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) => store().deleteGroupServiceRoster(groupId, serviceDate, serviceTime);
