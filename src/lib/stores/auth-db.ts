import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type {
  ActivityItem,
  FamilyMember,
  MemberProfile,
  NotificationPrefs,
  PublicMember,
} from "@/lib/auth-types";
import { mapDbUserToProfile, notificationPrefsToDb } from "@/lib/auth-user-mapper";
import { prisma } from "@/lib/db";

export const SESSION_DAYS = 30;

export function toPublicMember(user: MemberProfile): PublicMember {
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

async function loadUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { family: true },
  });
  return user ? mapDbUserToProfile(user) : null;
}

export async function getUsers() {
  const users = await prisma.user.findMany({ include: { family: true } });
  return users.map(mapDbUserToProfile);
}

export async function getUserByEmail(email: string) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: { family: true },
  });
  return user ? mapDbUserToProfile(user) : null;
}

export async function getUserById(id: string) {
  return loadUser(id);
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

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: `user-${Date.now()}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim(),
      campusId: input.campusId,
      role: "member",
      passwordHash: await bcrypt.hash(input.password, 10),
      createdAt: now,
      updatedAt: now,
    },
    include: { family: true },
  });

  await logActivity(user.id, "signup", "Created Shanah City account");
  return mapDbUserToProfile(user);
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
  const existing = await loadUser(userId);
  if (!existing) return null;

  const prefs = update.notificationPrefs
    ? notificationPrefsToDb(update.notificationPrefs)
    : {};

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: update.name?.trim(),
      phone: update.phone?.trim(),
      campusId: update.campusId,
      role: update.role,
      avatarUrl: update.avatarUrl === "" ? null : update.avatarUrl,
      updatedAt: new Date(),
      ...prefs,
    },
    include: { family: true },
  });

  await logActivity(userId, "profile_update", "Updated profile");
  return mapDbUserToProfile(user);
}

export async function addFamilyMember(userId: string, member: FamilyMember) {
  const existing = await loadUser(userId);
  if (!existing) return null;

  await prisma.familyMember.create({
    data: {
      id: member.id,
      userId,
      name: member.name,
      relationship: member.relationship,
      birthYear: member.birthYear,
      notes: member.notes,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
  });

  await logActivity(userId, "family_added", `Added ${member.name} to family`);
  return loadUser(userId);
}

export async function removeFamilyMember(userId: string, memberId: string) {
  const existing = await loadUser(userId);
  if (!existing) return null;

  await prisma.familyMember.deleteMany({
    where: { id: memberId, userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
  });

  return loadUser(userId);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  await logActivity(userId, "signin", "Signed in");
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserFromSession(token?: string | null) {
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await deleteSession(token);
    return null;
  }

  const user = await loadUser(session.userId);
  return user ? toPublicMember(user) : null;
}

export async function getActivity(userId: string) {
  const activity = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return activity.map((item) => ({
    id: item.id,
    userId: item.userId,
    type: item.type as ActivityItem["type"],
    label: item.label,
    createdAt: item.createdAt.toISOString(),
  }));
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
  const existing = await loadUser(userId);
  if (!existing) return null;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      pushEnabled: prefs.pushEnabled ?? existing.notificationPrefs?.pushEnabled ?? true,
      notifyDevotions: prefs.devotions ?? existing.notificationPrefs?.devotions ?? true,
      notifyMessages: prefs.messages ?? existing.notificationPrefs?.messages ?? true,
      notifyAnnouncements:
        prefs.announcements ?? existing.notificationPrefs?.announcements ?? true,
      updatedAt: new Date(),
    },
    include: { family: true },
  });

  await logActivity(userId, "notifications_updated", "Updated notification preferences");
  return mapDbUserToProfile(user);
}

export async function promoteUserRole(
  userId: string,
  role: NonNullable<MemberProfile["role"]>,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role, updatedAt: new Date() },
    include: { family: true },
  });

  await logActivity(userId, "leader_promoted", `Role updated to ${role}`);
  return mapDbUserToProfile(user);
}

async function logActivity(
  userId: string,
  type: ActivityItem["type"],
  label: string,
) {
  await prisma.activityLog.create({
    data: {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      type,
      label,
      createdAt: new Date(),
    },
  });

  const count = await prisma.activityLog.count();
  if (count > 500) {
    const oldest = await prisma.activityLog.findMany({
      orderBy: { createdAt: "asc" },
      take: count - 500,
      select: { id: true },
    });
    await prisma.activityLog.deleteMany({
      where: { id: { in: oldest.map((item) => item.id) } },
    });
  }
}
