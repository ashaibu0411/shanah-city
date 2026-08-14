import { useDatabase } from "@/lib/use-database";
import * as groupJoinDb from "@/lib/stores/group-join-db";
import * as groupJoinJson from "@/lib/stores/group-join-json";

const store = () => (useDatabase() ? groupJoinDb : groupJoinJson);

export const requestGroupJoin = (
  groupId: string,
  user: Parameters<typeof groupJoinJson.requestGroupJoin>[1],
) => store().requestGroupJoin(groupId, user);

export const processSignupGroupSelections = (
  user: Parameters<typeof groupJoinJson.processSignupGroupSelections>[0],
  groupIds: string[],
) => store().processSignupGroupSelections(user, groupIds);

export const listPendingJoinRequests = (reviewerId: string) =>
  store().listPendingJoinRequests(reviewerId);

export const approveJoinRequest = (requestId: string, reviewerId: string) =>
  store().approveJoinRequest(requestId, reviewerId);

export const rejectJoinRequest = (requestId: string, reviewerId: string) =>
  store().rejectJoinRequest(requestId, reviewerId);

export const listUserJoinRequests = (userId: string) =>
  store().listUserJoinRequests(userId);
