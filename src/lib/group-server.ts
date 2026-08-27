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
export const removeGroupMember = (
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().removeGroupMember(groupId, adminId, memberId, options);
export const addGroupMember = (
  groupId: string,
  adminId: string,
  email: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().addGroupMember(groupId, adminId, email, options);
export const addGroupMemberById = (
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().addGroupMemberById(groupId, adminId, memberId, options);
export const searchGroupMemberCandidates = (
  groupId: string,
  actorId: string,
  query: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().searchGroupMemberCandidates(groupId, actorId, query, options);
export const promoteGroupAdmin = (
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().promoteGroupAdmin(groupId, adminId, memberId, options);
export const demoteGroupAdmin = (
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().demoteGroupAdmin(groupId, adminId, memberId, options);
export const promoteGroupAssistant = (
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().promoteGroupAssistant(groupId, adminId, memberId, options);
export const demoteGroupAssistant = (
  groupId: string,
  adminId: string,
  memberId: string,
  options?: { actorIsSiteAdmin?: boolean },
) => store().demoteGroupAssistant(groupId, adminId, memberId, options);
export const getSignupGroupOptions = () => store().getSignupGroupOptions();
