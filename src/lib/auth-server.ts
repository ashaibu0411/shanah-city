import type {
  ActivityItem,
  FamilyMember,
  MemberProfile,
  NotificationPrefs,
  PublicMember,
} from "@/lib/auth-types";
import { verifyLeaderPin } from "@/lib/member-server";
import { useDatabase } from "@/lib/use-database";
import * as authDb from "@/lib/stores/auth-db";
import * as authJson from "@/lib/stores/auth-json";

export const SESSION_COOKIE = "shanah_session";
export const SESSION_DAYS = 30;

const store = () => (useDatabase() ? authDb : authJson);

export const toPublicMember = (user: MemberProfile): PublicMember =>
  store().toPublicMember(user);

export const getUsers = () => store().getUsers();
export const getUserByEmail = (email: string) => store().getUserByEmail(email);
export const getUserById = (id: string) => store().getUserById(id);
export const createUser = (input: Parameters<typeof authJson.createUser>[0]) =>
  store().createUser(input);
export const verifyCredentials = (email: string, password: string) =>
  store().verifyCredentials(email, password);
export const updateUserProfile = (
  userId: string,
  update: Parameters<typeof authJson.updateUserProfile>[1],
) => store().updateUserProfile(userId, update);
export const addFamilyMember = (userId: string, member: FamilyMember) =>
  store().addFamilyMember(userId, member);
export const removeFamilyMember = (userId: string, memberId: string) =>
  store().removeFamilyMember(userId, memberId);
export const createSession = (userId: string) => store().createSession(userId);
export const deleteSession = (token: string) => store().deleteSession(token);
export const getUserFromSession = (token?: string | null) =>
  store().getUserFromSession(token);
export const getActivity = (userId: string) => store().getActivity(userId);
export const recordActivity = (
  userId: string,
  type: ActivityItem["type"],
  label: string,
) => store().recordActivity(userId, type, label);
export const updateNotificationPrefs = (
  userId: string,
  prefs: Partial<NotificationPrefs>,
) => store().updateNotificationPrefs(userId, prefs);
export const promoteUserRole = (
  userId: string,
  role: NonNullable<MemberProfile["role"]>,
) => store().promoteUserRole(userId, role);
export const updateUserPassword = (userId: string, password: string) =>
  store().updateUserPassword(userId, password);

export function isLeader(user: PublicMember | null) {
  return user?.role === "leader";
}

export function canManageDevotions(
  user: PublicMember | null,
  pin?: string | null,
) {
  if (!user) return false;
  if (isLeader(user)) return true;
  if (pin && verifyLeaderPin(pin)) return true;
  return false;
}
