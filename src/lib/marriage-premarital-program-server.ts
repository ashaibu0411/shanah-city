import type { PublicMember } from "@/lib/auth-types";
import {
  assertClinicalCounselorForJourney,
  assertJourneyParticipantLoose,
} from "@/lib/marriage-counseling-access";
import { resolveJourneyPartnerId } from "@/lib/marriage-counseling-participants";
import type {
  MarriageCouplePremaritalProgramView,
  MarriagePremaritalProgramSessionRecord,
  MarriagePremaritalProgramSessionStatus,
} from "@/lib/marriage-counseling-types";
import {
  PREMARITAL_EIGHT_SESSION_PROGRAM_KEY,
  PREMARITAL_PROGRAM_SESSIONS,
  getPremaritalSessionDefinition,
  type PremaritalProgramSessionDefinition,
} from "@/lib/marriage-premarital-eight-session-program";
import {
  getActiveContentVersionLabel,
  getModuleForContentVersion,
  listModulesForJourney,
} from "@/lib/marriage-curriculum-service";
import { participantHomeworkStatus } from "@/lib/marriage-homework-status";
import { homeworkTemplateMeta } from "@/lib/marriage-homework-template-meta";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";

const store = () => marriageStore();

export type MarriageCounselorPremaritalProgramView = {
  programKey: string;
  paused: boolean;
  extraSessionCount: number;
  currentSessionKey: string | null;
  sessionsCompleted: number;
  sessionsTotal: number;
  sessions: Array<
    PremaritalProgramSessionDefinition & {
      status: MarriagePremaritalProgramSessionStatus;
      privateNotes: string | null;
      checklistCompleted: Record<string, boolean>;
      linkedModulesDetailed: Array<{
        moduleId: string;
        title: string;
        recommendedForSession: boolean;
        bothSubmitted: boolean;
      }>;
      homeworkRows: Array<{
        homeworkId: string;
        title: string;
        status: string;
        templateKey: string | null;
      }>;
      suggestedHomeworkTemplateKeys: string[];
    }
  >;
};

async function ensurePremaritalProgramSessions(journeyId: string) {
  const existing = await store().listPremaritalProgramSessionsForJourney(journeyId);
  const byKey = new Map(existing.map((s) => [s.sessionKey, s]));
  const now = new Date().toISOString();
  for (const def of PREMARITAL_PROGRAM_SESSIONS) {
    if (byKey.has(def.sessionKey)) continue;
    await store().savePremaritalProgramSession({
      journeyId,
      sessionKey: def.sessionKey,
      status: "not_started",
      privateNotes: null,
      checklistCompleted: {},
      completedAt: null,
      updatedAt: now,
      updatedByUserId: null,
    });
  }
  let meta = await store().getPremaritalProgramMeta(journeyId);
  if (!meta) {
    meta = {
      journeyId,
      pausedAt: null,
      extraSessionCount: 0,
      updatedAt: now,
    };
    await store().savePremaritalProgramMeta(meta);
  }
}

function deriveCurrentSessionKey(
  records: MarriagePremaritalProgramSessionRecord[],
): string | null {
  const byKey = new Map(records.map((r) => [r.sessionKey, r]));
  for (const def of PREMARITAL_PROGRAM_SESSIONS) {
    const row = byKey.get(def.sessionKey);
    if (!row || row.status !== "completed") return def.sessionKey;
  }
  return PREMARITAL_PROGRAM_SESSIONS[PREMARITAL_PROGRAM_SESSIONS.length - 1]?.sessionKey ?? null;
}

function responseStatus(
  response: { status?: string; submittedAt?: string | null } | null | undefined,
): "not_started" | "draft" | "submitted" {
  if (!response) return "not_started";
  if (response.status === "submitted" || response.submittedAt) return "submitted";
  return "draft";
}

async function moduleProgressForJourney(
  journey: MarriageCounselingJourneyRecord,
  moduleId: string,
  viewerId: string,
  partnerId: string | null,
) {
  const version = journey.curriculumVersion ?? (await getActiveContentVersionLabel());
  const mod = await getModuleForContentVersion(moduleId, version);
  const myResponse = await store().getResponse(journey.id, moduleId, viewerId);
  const partnerResponse = partnerId
    ? await store().getResponse(journey.id, moduleId, partnerId)
    : null;
  return {
    moduleId,
    title: mod?.title ?? moduleId,
    myStatus: responseStatus(myResponse),
    partnerStatus: partnerId ? responseStatus(partnerResponse) : ("unknown" as const),
    bothSubmitted:
      responseStatus(myResponse) === "submitted" &&
      (!partnerId || responseStatus(partnerResponse) === "submitted"),
  };
}

export async function buildCouplePremaritalProgramView(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCouplePremaritalProgramView | null> {
  if (journey.programType !== "premarital") return null;
  await assertJourneyParticipantLoose(journey, viewer.id);
  await ensurePremaritalProgramSessions(journey.id);

  const records = await store().listPremaritalProgramSessionsForJourney(journey.id);
  const meta = await store().getPremaritalProgramMeta(journey.id);
  const partnerId = await resolveJourneyPartnerId(journey, viewer.id);

  const homeworkRows = await store().listSessionHomeworkForJourney(journey.id);
  const releasedHomework = homeworkRows.filter((h) => h.status === "released");

  const { buildCoupleAppointmentViews } = await import("@/lib/marriage-premarital-operations-server");
  const { marriageSessionInstantMs } = await import("@/lib/marriage-session-scheduling");
  const nowMs = Date.now();
  const journeyAppointments = await buildCoupleAppointmentViews(viewer, journey.id);
  function appointmentForSessionKey(sessionKey: string) {
    const forKey = journeyAppointments.filter((a) => a.premaritalSessionKey === sessionKey);
    if (forKey.length === 0) return null;
    const upcoming = forKey
      .filter((a) => marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone) >= nowMs)
      .sort(
        (a, b) =>
          marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone) -
          marriageSessionInstantMs(b.scheduledAt, b.schedulingTimeZone),
      );
    if (upcoming[0]) return upcoming[0];
    const past = forKey
      .filter((a) => marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone) < nowMs)
      .sort(
        (a, b) =>
          marriageSessionInstantMs(b.scheduledAt, b.schedulingTimeZone) -
          marriageSessionInstantMs(a.scheduledAt, a.schedulingTimeZone),
      );
    return past[0] ?? null;
  }

  const sessions = await Promise.all(
    PREMARITAL_PROGRAM_SESSIONS.map(async (def) => {
      const row = records.find((r) => r.sessionKey === def.sessionKey);
      const linkedModules = await Promise.all(
        def.linkedModules.map((link) =>
          moduleProgressForJourney(journey, link.moduleId, viewer.id, partnerId),
        ),
      );
      const templateKeys = new Set(def.homeworkTemplateKeys);
      const now = Date.now();
      const sessionHomework = await Promise.all(
        releasedHomework
          .filter((h) => h.templateKey && templateKeys.has(h.templateKey))
          .map(async (h) => {
            const response = await store().getSessionHomeworkResponse(h.id, viewer.id);
            const timing = homeworkTemplateMeta(h.templateKey);
            return {
              homeworkId: h.id,
              title: h.title,
              status: participantHomeworkStatus({ homework: h, response, nowMs: now }),
              dueAt: h.dueAt ?? null,
              timingLabel: timing?.timingLabel,
              assignedAfterLabel: timing?.assignedAfterLabel,
              preparingForLabel: timing?.preparingForLabel,
              postProgramNote: timing?.postProgramNote,
              estimatedMinutes: timing?.estimatedMinutes,
            };
          }),
      );

      return {
        sessionKey: def.sessionKey,
        order: def.order,
        title: def.title,
        purpose: def.purpose,
        status: row?.status ?? "not_started",
        linkedModules: linkedModules.map((m, i) => ({
          moduleId: m.moduleId,
          title: m.title,
          recommendedForSession: def.linkedModules[i]!.recommendedForSession,
          myStatus: m.myStatus,
          partnerStatus: m.partnerStatus,
        })),
        releasedHomework: sessionHomework,
        appointment: appointmentForSessionKey(def.sessionKey),
      };
    }),
  );

  const completed = records.filter((r) => r.status === "completed").length;

  const allReleasedHomework: MarriageCouplePremaritalProgramView["allReleasedHomework"] = [];
  const seenHw = new Set<string>();
  for (const session of sessions) {
    for (const hw of session.releasedHomework) {
      if (seenHw.has(hw.homeworkId)) continue;
      seenHw.add(hw.homeworkId);
      allReleasedHomework.push(hw);
    }
  }

  return {
    programKey: PREMARITAL_EIGHT_SESSION_PROGRAM_KEY,
    paused: Boolean(meta?.pausedAt),
    currentSessionKey: deriveCurrentSessionKey(records),
    sessionsCompleted: completed,
    sessionsTotal: PREMARITAL_PROGRAM_SESSIONS.length,
    sessions,
    allReleasedHomework,
  };
}

export async function buildCounselorPremaritalProgramView(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCounselorPremaritalProgramView | null> {
  if (journey.programType !== "premarital") return null;
  await assertClinicalCounselorForJourney(viewer, journey);
  await ensurePremaritalProgramSessions(journey.id);

  const records = await store().listPremaritalProgramSessionsForJourney(journey.id);
  const meta = await store().getPremaritalProgramMeta(journey.id);
  const homeworkRows = await store().listSessionHomeworkForJourney(journey.id);
  const modules = await listModulesForJourney(journey);
  const moduleTitle = (id: string) => modules.find((m) => m.id === id)?.title ?? id;

  const sessions = PREMARITAL_PROGRAM_SESSIONS.map((def) => {
    const row = records.find((r) => r.sessionKey === def.sessionKey);
    const templateKeys = new Set(def.homeworkTemplateKeys);
    return {
      ...def,
      status: row?.status ?? "not_started",
      privateNotes: row?.privateNotes ?? null,
      checklistCompleted: row?.checklistCompleted ?? {},
      linkedModulesDetailed: def.linkedModules.map((link) => ({
        moduleId: link.moduleId,
        title: moduleTitle(link.moduleId),
        recommendedForSession: link.recommendedForSession,
        bothSubmitted: false,
      })),
      homeworkRows: homeworkRows
        .filter((h) => h.templateKey && templateKeys.has(h.templateKey))
        .map((h) => ({
          homeworkId: h.id,
          title: h.title,
          status: h.status,
          templateKey: h.templateKey ?? null,
        })),
      suggestedHomeworkTemplateKeys: def.homeworkTemplateKeys,
    };
  });

  await Promise.all(
    sessions.map(async (session) => {
      for (const link of session.linkedModulesDetailed) {
        const responses = await store().listResponsesForJourneyModule(journey.id, link.moduleId);
        const subs = responses.filter((r) => r.status === "submitted" || r.submittedAt);
        link.bothSubmitted = subs.length >= 2;
      }
    }),
  );

  const completed = records.filter((r) => r.status === "completed").length;

  return {
    programKey: PREMARITAL_EIGHT_SESSION_PROGRAM_KEY,
    paused: Boolean(meta?.pausedAt),
    extraSessionCount: meta?.extraSessionCount ?? 0,
    currentSessionKey: deriveCurrentSessionKey(records),
    sessionsCompleted: completed,
    sessionsTotal: PREMARITAL_PROGRAM_SESSIONS.length,
    sessions,
  };
}

export async function updatePremaritalSessionStatus(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
  status: MarriagePremaritalProgramSessionStatus,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  if (!getPremaritalSessionDefinition(sessionKey)) throw new Error("Unknown session.");
  if (status === "completed") {
    const { assertPremaritalCompletionAllowed } = await import("@/lib/marriage-self-paced-server");
    await assertPremaritalCompletionAllowed(viewer, journeyId, sessionKey, "completed");
  }
  await ensurePremaritalProgramSessions(journeyId);

  const existing =
    (await store().listPremaritalProgramSessionsForJourney(journeyId)).find(
      (s) => s.sessionKey === sessionKey,
    ) ?? null;
  const now = new Date().toISOString();
  const record: MarriagePremaritalProgramSessionRecord = {
    journeyId,
    sessionKey,
    status,
    privateNotes: existing?.privateNotes ?? null,
    checklistCompleted: existing?.checklistCompleted ?? {},
    completedAt:
      status === "completed"
        ? existing?.completedAt ?? now
        : status === "not_started"
          ? null
          : existing?.completedAt ?? null,
    updatedAt: now,
    updatedByUserId: viewer.id,
  };
  await store().savePremaritalProgramSession(record);
  if (status === "completed" && existing?.status !== "completed") {
    const { notifyMarriageSessionCompleted } = await import("@/lib/marriage-counseling-notify");
    void notifyMarriageSessionCompleted(journey, sessionKey);
    const { checkEightSessionCompletionAndNotify } = await import(
      "@/lib/marriage-prep-notification-triggers"
    );
    void checkEightSessionCompletionAndNotify(journey);
  }
  return record;
}

export async function savePremaritalSessionPrivateNotes(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
  privateNotes: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  if (!getPremaritalSessionDefinition(sessionKey)) throw new Error("Unknown session.");
  await ensurePremaritalProgramSessions(journeyId);

  const existing =
    (await store().listPremaritalProgramSessionsForJourney(journeyId)).find(
      (s) => s.sessionKey === sessionKey,
    ) ?? null;
  const now = new Date().toISOString();
  const record: MarriagePremaritalProgramSessionRecord = {
    journeyId,
    sessionKey,
    status: existing?.status ?? "not_started",
    privateNotes: privateNotes.trim() || null,
    checklistCompleted: existing?.checklistCompleted ?? {},
    completedAt: existing?.completedAt ?? null,
    updatedAt: now,
    updatedByUserId: viewer.id,
  };
  await store().savePremaritalProgramSession(record);
  return record;
}

export async function updatePremaritalSessionChecklist(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
  checklistIndex: number,
  completed: boolean,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  const def = getPremaritalSessionDefinition(sessionKey);
  if (!def) throw new Error("Unknown session.");
  if (checklistIndex < 0 || checklistIndex >= def.completionChecklist.length) {
    throw new Error("Invalid checklist item.");
  }
  await ensurePremaritalProgramSessions(journeyId);

  const existing =
    (await store().listPremaritalProgramSessionsForJourney(journeyId)).find(
      (s) => s.sessionKey === sessionKey,
    ) ?? null;
  const checklistCompleted = { ...(existing?.checklistCompleted ?? {}) };
  checklistCompleted[String(checklistIndex)] = completed;
  const now = new Date().toISOString();
  const record: MarriagePremaritalProgramSessionRecord = {
    journeyId,
    sessionKey,
    status: existing?.status ?? "not_started",
    privateNotes: existing?.privateNotes ?? null,
    checklistCompleted,
    completedAt: existing?.completedAt ?? null,
    updatedAt: now,
    updatedByUserId: viewer.id,
  };
  await store().savePremaritalProgramSession(record);
  return record;
}

export async function setPremaritalProgramPaused(
  viewer: PublicMember,
  journeyId: string,
  paused: boolean,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  await ensurePremaritalProgramSessions(journeyId);
  const now = new Date().toISOString();
  const meta = {
    journeyId,
    pausedAt: paused ? now : null,
    extraSessionCount: (await store().getPremaritalProgramMeta(journeyId))?.extraSessionCount ?? 0,
    updatedAt: now,
  };
  await store().savePremaritalProgramMeta(meta);
  return meta;
}
