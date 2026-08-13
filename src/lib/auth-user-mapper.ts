import type { FamilyMember, MemberProfile, NotificationPrefs } from "@/lib/auth-types";
import type { FamilyMember as DbFamilyMember, User as DbUser } from "@prisma/client";

type DbUserWithFamily = DbUser & { family: DbFamilyMember[] };

export function mapDbUserToProfile(user: DbUserWithFamily): MemberProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    campusId: user.campusId,
    role: user.role as MemberProfile["role"],
    avatarUrl: user.avatarUrl ?? undefined,
    notificationPrefs: {
      pushEnabled: user.pushEnabled,
      devotions: user.notifyDevotions,
      messages: user.notifyMessages,
      announcements: user.notifyAnnouncements,
    },
    passwordHash: user.passwordHash,
    family: user.family.map(mapDbFamilyMember),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function mapDbFamilyMember(member: DbFamilyMember): FamilyMember {
  return {
    id: member.id,
    name: member.name,
    relationship: member.relationship as FamilyMember["relationship"],
    birthYear: member.birthYear ?? undefined,
    notes: member.notes ?? undefined,
  };
}

export function notificationPrefsToDb(prefs?: Partial<NotificationPrefs>) {
  if (!prefs) return {};
  return {
    pushEnabled: prefs.pushEnabled,
    notifyDevotions: prefs.devotions,
    notifyMessages: prefs.messages,
    notifyAnnouncements: prefs.announcements,
  };
}
