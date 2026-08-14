import { useDatabase } from "@/lib/use-database";
import * as groupDb from "@/lib/stores/group-db";
import * as groupJson from "@/lib/stores/group-json";

const store = () => (useDatabase() ? groupDb : groupJson);

export const getGroups = () => store().getGroups();
export const listGroupsForUser = (
  userId?: string,
  options?: Parameters<typeof groupJson.listGroupsForUser>[1],
) => store().listGroupsForUser(userId, options);
export const getGroupDetail = (groupId: string, userId?: string) =>
  store().getGroupDetail(groupId, userId);
export const createGroup = (input: Parameters<typeof groupJson.createGroup>[0]) =>
  store().createGroup(input);
export const joinGroup = (groupId: string, userId: string) =>
  store().joinGroup(groupId, userId);
export const leaveGroup = (groupId: string, userId: string) =>
  store().leaveGroup(groupId, userId);
export const updateGroup = (
  groupId: string,
  userId: string,
  updates: Parameters<typeof groupJson.updateGroup>[2],
) => store().updateGroup(groupId, userId, updates);
export const deleteGroup = (groupId: string, userId: string) =>
  store().deleteGroup(groupId, userId);
export const removeGroupMember = (groupId: string, adminId: string, memberId: string) =>
  store().removeGroupMember(groupId, adminId, memberId);
export const addGroupMember = (groupId: string, adminId: string, email: string) =>
  store().addGroupMember(groupId, adminId, email);
export const promoteGroupAdmin = (groupId: string, adminId: string, memberId: string) =>
  store().promoteGroupAdmin(groupId, adminId, memberId);
export const demoteGroupAdmin = (groupId: string, adminId: string, memberId: string) =>
  store().demoteGroupAdmin(groupId, adminId, memberId);
export const getSignupGroupOptions = () => store().getSignupGroupOptions();
