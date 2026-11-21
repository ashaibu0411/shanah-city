import { prisma } from "@/lib/db";
import type {
  KidsAnnouncement,
  KidsAssignmentStatus,
  KidsLessonCompletion,
  KidsTeacherAssignment,
  KidsTeacherRole,
  KidsVolunteerProfile,
} from "@/lib/kids-workspace-types";

function mapAssignment(record: {
  id: string;
  userId: string;
  userName: string;
  role: string;
  ageGroup: string;
  service: string;
  serviceDate: string;
  status: string;
  notes: string | null;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
}): KidsTeacherAssignment {
  return {
    id: record.id,
    userId: record.userId,
    userName: record.userName,
    role: record.role as KidsTeacherRole,
    ageGroup: record.ageGroup,
    service: record.service,
    serviceDate: record.serviceDate,
    status: record.status as KidsAssignmentStatus,
    notes: record.notes ?? undefined,
    assignedBy: record.assignedBy,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listKidsAssignments(options?: {
  serviceDate?: string;
  service?: string;
  userId?: string;
}) {
  const where: { serviceDate?: string; service?: string; userId?: string } = {};
  if (options?.serviceDate) where.serviceDate = options.serviceDate;
  if (options?.service) where.service = options.service;
  if (options?.userId) where.userId = options.userId;
  const records = await prisma.kidsTeacherAssignment.findMany({
    where,
    orderBy: [{ serviceDate: "asc" }, { ageGroup: "asc" }],
  });
  return records.map(mapAssignment);
}

export async function saveKidsAssignment(assignment: KidsTeacherAssignment) {
  const record = await prisma.kidsTeacherAssignment.upsert({
    where: { id: assignment.id },
    create: {
      id: assignment.id,
      userId: assignment.userId,
      userName: assignment.userName,
      role: assignment.role,
      ageGroup: assignment.ageGroup,
      service: assignment.service,
      serviceDate: assignment.serviceDate,
      status: assignment.status,
      notes: assignment.notes,
      assignedBy: assignment.assignedBy,
      createdAt: new Date(assignment.createdAt),
      updatedAt: new Date(assignment.updatedAt),
    },
    update: {
      userName: assignment.userName,
      role: assignment.role,
      ageGroup: assignment.ageGroup,
      service: assignment.service,
      serviceDate: assignment.serviceDate,
      status: assignment.status,
      notes: assignment.notes,
      updatedAt: new Date(assignment.updatedAt),
    },
  });
  return mapAssignment(record);
}

export async function deleteKidsAssignment(id: string) {
  await prisma.kidsTeacherAssignment.delete({ where: { id } }).catch(() => undefined);
}

export async function listKidsVolunteerProfiles() {
  const records = await prisma.kidsVolunteerProfile.findMany({ orderBy: { userName: "asc" } });
  return records.map(
    (record): KidsVolunteerProfile => ({
      userId: record.userId,
      userName: record.userName,
      roles: Array.isArray(record.roles)
        ? (record.roles as string[])
        : record.roles
          ? Object.values(record.roles as Record<string, string>)
          : [],
      onboardingComplete: record.onboardingComplete,
      safeguardingCompletedAt: record.safeguardingCompletedAt?.toISOString(),
      availabilityNotes: record.availabilityNotes ?? undefined,
      updatedAt: record.updatedAt.toISOString(),
    }),
  );
}

export async function saveKidsVolunteerProfile(profile: KidsVolunteerProfile) {
  const record = await prisma.kidsVolunteerProfile.upsert({
    where: { userId: profile.userId },
    create: {
      userId: profile.userId,
      userName: profile.userName,
      roles: profile.roles,
      onboardingComplete: profile.onboardingComplete,
      safeguardingCompletedAt: profile.safeguardingCompletedAt
        ? new Date(profile.safeguardingCompletedAt)
        : null,
      availabilityNotes: profile.availabilityNotes,
      updatedAt: new Date(profile.updatedAt),
    },
    update: {
      userName: profile.userName,
      roles: profile.roles,
      onboardingComplete: profile.onboardingComplete,
      safeguardingCompletedAt: profile.safeguardingCompletedAt
        ? new Date(profile.safeguardingCompletedAt)
        : null,
      availabilityNotes: profile.availabilityNotes,
      updatedAt: new Date(profile.updatedAt),
    },
  });
  return {
    userId: record.userId,
    userName: record.userName,
    roles: profile.roles,
    onboardingComplete: record.onboardingComplete,
    safeguardingCompletedAt: record.safeguardingCompletedAt?.toISOString(),
    availabilityNotes: record.availabilityNotes ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listKidsLessonCompletions(options?: { weekStarting?: string; service?: string }) {
  const where: { weekStarting?: string; service?: string } = {};
  if (options?.weekStarting) where.weekStarting = options.weekStarting;
  if (options?.service) where.service = options.service;
  const records = await prisma.kidsLessonCompletion.findMany({ where, orderBy: { completedAt: "desc" } });
  return records.map(
    (record): KidsLessonCompletion => ({
      id: record.id,
      lessonId: record.lessonId,
      weekStarting: record.weekStarting,
      ageGroup: record.ageGroup,
      service: record.service,
      serviceDate: record.serviceDate,
      completedBy: record.completedBy,
      completedByName: record.completedByName,
      notes: record.notes ?? undefined,
      completedAt: record.completedAt.toISOString(),
    }),
  );
}

export async function saveKidsLessonCompletion(completion: KidsLessonCompletion) {
  const record = await prisma.kidsLessonCompletion.upsert({
    where: {
      weekStarting_ageGroup_service_serviceDate: {
        weekStarting: completion.weekStarting,
        ageGroup: completion.ageGroup,
        service: completion.service,
        serviceDate: completion.serviceDate,
      },
    },
    create: {
      id: completion.id,
      lessonId: completion.lessonId,
      weekStarting: completion.weekStarting,
      ageGroup: completion.ageGroup,
      service: completion.service,
      serviceDate: completion.serviceDate,
      completedBy: completion.completedBy,
      completedByName: completion.completedByName,
      notes: completion.notes,
      completedAt: new Date(completion.completedAt),
    },
    update: {
      lessonId: completion.lessonId,
      completedBy: completion.completedBy,
      completedByName: completion.completedByName,
      notes: completion.notes,
      completedAt: new Date(completion.completedAt),
    },
  });
  return {
    id: record.id,
    lessonId: record.lessonId,
    weekStarting: record.weekStarting,
    ageGroup: record.ageGroup,
    service: record.service,
    serviceDate: record.serviceDate,
    completedBy: record.completedBy,
    completedByName: record.completedByName,
    notes: record.notes ?? undefined,
    completedAt: record.completedAt.toISOString(),
  };
}

export async function listKidsAnnouncements(limit = 30) {
  const records = await prisma.kidsAnnouncement.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return records.map(
    (record): KidsAnnouncement => ({
      id: record.id,
      title: record.title,
      body: record.body,
      audience: record.audience as KidsAnnouncement["audience"],
      createdBy: record.createdBy,
      createdByName: record.createdByName,
      publishedAt: record.publishedAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
    }),
  );
}

export async function saveKidsAnnouncement(announcement: KidsAnnouncement) {
  const record = await prisma.kidsAnnouncement.upsert({
    where: { id: announcement.id },
    create: {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      createdBy: announcement.createdBy,
      createdByName: announcement.createdByName,
      publishedAt: announcement.publishedAt ? new Date(announcement.publishedAt) : null,
      createdAt: new Date(announcement.createdAt),
    },
    update: {
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      publishedAt: announcement.publishedAt ? new Date(announcement.publishedAt) : null,
    },
  });
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    audience: record.audience as KidsAnnouncement["audience"],
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    publishedAt: record.publishedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}