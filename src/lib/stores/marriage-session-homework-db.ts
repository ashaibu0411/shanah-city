import { prisma } from "@/lib/db";
import type {
  MarriageHomeworkActivityDef,
  MarriageSessionHomeworkRecord,
  MarriageSessionHomeworkResponseRecord,
  MarriageSessionHomeworkStatus,
} from "@/lib/marriage-homework-types";

function mapHomework(row: {
  id: string;
  journeyId: string;
  counselorUserId: string;
  sessionId: string | null;
  templateKey: string | null;
  title: string;
  instructions: string | null;
  status: string;
  dueAt: Date | null;
  dueAtTimeZone: string | null;
  activitiesJson: string;
  counselorPrivateNotes: string | null;
  partnerFeedbackJson: string | null;
  releasedAt: Date | null;
  reopenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): MarriageSessionHomeworkRecord {
  return {
    id: row.id,
    journeyId: row.journeyId,
    counselorUserId: row.counselorUserId,
    sessionId: row.sessionId ?? undefined,
    templateKey: row.templateKey ?? undefined,
    title: row.title,
    instructions: row.instructions ?? undefined,
    status: row.status as MarriageSessionHomeworkStatus,
    dueAt: row.dueAt?.toISOString(),
    dueAtTimeZone: row.dueAtTimeZone ?? undefined,
    activities: JSON.parse(row.activitiesJson) as MarriageHomeworkActivityDef[],
    counselorPrivateNotes: row.counselorPrivateNotes ?? undefined,
    partnerFeedback: row.partnerFeedbackJson
      ? (JSON.parse(row.partnerFeedbackJson) as Record<string, string>)
      : undefined,
    releasedAt: row.releasedAt?.toISOString(),
    reopenedAt: row.reopenedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listSessionHomeworkForJourney(journeyId: string) {
  const rows = await prisma.marriageSessionHomework.findMany({
    where: { journeyId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapHomework);
}

export async function getSessionHomeworkById(id: string) {
  const row = await prisma.marriageSessionHomework.findUnique({ where: { id } });
  return row ? mapHomework(row) : null;
}

export async function findDraftSessionHomeworkByTemplate(journeyId: string, templateKey: string) {
  const row = await prisma.marriageSessionHomework.findFirst({
    where: { journeyId, templateKey, status: "draft" },
  });
  return row ? mapHomework(row) : null;
}

export async function saveSessionHomework(record: MarriageSessionHomeworkRecord) {
  await prisma.marriageSessionHomework.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      journeyId: record.journeyId,
      counselorUserId: record.counselorUserId,
      sessionId: record.sessionId ?? null,
      templateKey: record.templateKey ?? null,
      title: record.title,
      instructions: record.instructions ?? null,
      status: record.status,
      dueAt: record.dueAt ? new Date(record.dueAt) : null,
      dueAtTimeZone: record.dueAtTimeZone ?? null,
      activitiesJson: JSON.stringify(record.activities),
      counselorPrivateNotes: record.counselorPrivateNotes ?? null,
      partnerFeedbackJson: record.partnerFeedback ? JSON.stringify(record.partnerFeedback) : null,
      releasedAt: record.releasedAt ? new Date(record.releasedAt) : null,
      reopenedAt: record.reopenedAt ? new Date(record.reopenedAt) : null,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    },
    update: {
      sessionId: record.sessionId ?? null,
      templateKey: record.templateKey ?? null,
      title: record.title,
      instructions: record.instructions ?? null,
      status: record.status,
      dueAt: record.dueAt ? new Date(record.dueAt) : null,
      dueAtTimeZone: record.dueAtTimeZone ?? null,
      activitiesJson: JSON.stringify(record.activities),
      counselorPrivateNotes: record.counselorPrivateNotes ?? null,
      partnerFeedbackJson: record.partnerFeedback ? JSON.stringify(record.partnerFeedback) : null,
      releasedAt: record.releasedAt ? new Date(record.releasedAt) : null,
      reopenedAt: record.reopenedAt ? new Date(record.reopenedAt) : null,
      updatedAt: new Date(record.updatedAt),
    },
  });
  return record;
}

export async function listSessionHomeworkResponses(homeworkId: string) {
  const rows = await prisma.marriageSessionHomeworkResponse.findMany({ where: { homeworkId } });
  return rows.map(
    (r): MarriageSessionHomeworkResponseRecord => ({
      homeworkId: r.homeworkId,
      userId: r.userId,
      answers: JSON.parse(r.answersJson) as Record<string, string>,
      lastSavedAt: r.lastSavedAt.toISOString(),
      submittedAt: r.submittedAt?.toISOString(),
    }),
  );
}

export async function getSessionHomeworkResponse(homeworkId: string, userId: string) {
  const r = await prisma.marriageSessionHomeworkResponse.findUnique({
    where: { homeworkId_userId: { homeworkId, userId } },
  });
  if (!r) return null;
  return {
    homeworkId: r.homeworkId,
    userId: r.userId,
    answers: JSON.parse(r.answersJson) as Record<string, string>,
    lastSavedAt: r.lastSavedAt.toISOString(),
    submittedAt: r.submittedAt?.toISOString(),
  };
}

export async function saveSessionHomeworkResponse(record: MarriageSessionHomeworkResponseRecord) {
  await prisma.marriageSessionHomeworkResponse.upsert({
    where: { homeworkId_userId: { homeworkId: record.homeworkId, userId: record.userId } },
    create: {
      homeworkId: record.homeworkId,
      userId: record.userId,
      answersJson: JSON.stringify(record.answers),
      lastSavedAt: new Date(record.lastSavedAt),
      submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
    },
    update: {
      answersJson: JSON.stringify(record.answers),
      lastSavedAt: new Date(record.lastSavedAt),
      submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
    },
  });
  return record;
}
