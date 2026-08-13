import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type {
  ActivityItem,
  FamilyMember,
  MemberProfile,
  NotificationPrefs,
  PublicMember,
} from "@/lib/auth-types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
export const SESSION_DAYS = 30;

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export function toPublicMember(user: MemberProfile): PublicMember {
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

export async function getUsers() {
  return readJson<MemberProfile[]>(USERS_FILE, []);
}

export async function getUserByEmail(email: string) {
  const users = await getUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(id: string) {
  const users = await getUsers();
  return users.find((user) => user.id === id);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  campusId: string;
}) {
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const now = new Date().toISOString();
  const user: MemberProfile = {
    id: `user-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim(),
    campusId: input.campusId,
    role: "member",
    notificationPrefs: {
      pushEnabled: true,
      devotions: true,
      messages: true,
      announcements: true,
    },
    passwordHash: await bcrypt.hash(input.password, 10),
    family: [],
    createdAt: now,
    updatedAt: now,
  };

  const users = await getUsers();
  users.push(user);
  await writeJson(USERS_FILE, users);
  await logActivity(user.id, "signup", "Created Shanah City account");
  return user;
}

export async function verifyCredentials(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function updateUserProfile(
  userId: string,
  update: Partial<
    Pick<MemberProfile, "name" | "phone" | "campusId" | "role" | "notificationPrefs" | "avatarUrl">
  >,
) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  const next = {
    ...users[index],
    ...update,
    updatedAt: new Date().toISOString(),
  };

  if (update.avatarUrl === "") {
    delete next.avatarUrl;
  }

  users[index] = next;
  await writeJson(USERS_FILE, users);
  await logActivity(userId, "profile_update", "Updated profile");
  return users[index];
}

export async function addFamilyMember(userId: string, member: FamilyMember) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  users[index].family = [...users[index].family, member];
  users[index].updatedAt = new Date().toISOString();
  await writeJson(USERS_FILE, users);
  await logActivity(userId, "family_added", `Added ${member.name} to family`);
  return users[index];
}

export async function removeFamilyMember(userId: string, memberId: string) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  users[index].family = users[index].family.filter((member) => member.id !== memberId);
  users[index].updatedAt = new Date().toISOString();
  await writeJson(USERS_FILE, users);
  return users[index];
}

async function getSessions() {
  return readJson<{ token: string; userId: string; expiresAt: string }[]>(SESSIONS_FILE, []);
}

async function saveSessions(sessions: { token: string; userId: string; expiresAt: string }[]) {
  await writeJson(SESSIONS_FILE, sessions);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const sessions = await getSessions();
  sessions.push({ token, userId, expiresAt });
  await saveSessions(sessions);
  await logActivity(userId, "signin", "Signed in");
  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((session) => session.token !== token));
}

export async function getUserFromSession(token?: string | null) {
  if (!token) return null;
  const sessions = await getSessions();
  const session = sessions.find((item) => item.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession(token);
    return null;
  }
  const user = await getUserById(session.userId);
  return user ? toPublicMember(user) : null;
}

export async function getActivity(userId: string) {
  const activity = await readJson<ActivityItem[]>(ACTIVITY_FILE, []);
  return activity.filter((item) => item.userId === userId).slice(0, 20);
}

export async function recordActivity(
  userId: string,
  type: ActivityItem["type"],
  label: string,
) {
  await logActivity(userId, type, label);
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: Partial<NotificationPrefs>,
) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  users[index].notificationPrefs = {
    pushEnabled: prefs.pushEnabled ?? users[index].notificationPrefs?.pushEnabled ?? true,
    devotions: prefs.devotions ?? users[index].notificationPrefs?.devotions ?? true,
    messages: prefs.messages ?? users[index].notificationPrefs?.messages ?? true,
    announcements:
      prefs.announcements ?? users[index].notificationPrefs?.announcements ?? true,
  };
  users[index].updatedAt = new Date().toISOString();
  await writeJson(USERS_FILE, users);
  await logActivity(userId, "notifications_updated", "Updated notification preferences");
  return users[index];
}

export async function promoteUserRole(
  userId: string,
  role: NonNullable<MemberProfile["role"]>,
) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  users[index].role = role;
  users[index].updatedAt = new Date().toISOString();
  await writeJson(USERS_FILE, users);
  await logActivity(userId, "leader_promoted", `Role updated to ${role}`);
  return users[index];
}

export async function updateUserPassword(userId: string, password: string) {
  const users = await getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  users[index].passwordHash = await bcrypt.hash(password, 10);
  users[index].updatedAt = new Date().toISOString();
  await writeJson(USERS_FILE, users);
  await logActivity(userId, "password_reset", "Password reset completed");
  return users[index];
}

async function logActivity(
  userId: string,
  type: ActivityItem["type"],
  label: string,
) {
  const activity = await readJson<ActivityItem[]>(ACTIVITY_FILE, []);
  activity.unshift({
    id: `act-${Date.now()}`,
    userId,
    type,
    label,
    createdAt: new Date().toISOString(),
  });
  await writeJson(ACTIVITY_FILE, activity.slice(0, 500));
}
