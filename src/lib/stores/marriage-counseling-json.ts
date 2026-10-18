import { promises as fs } from "fs";
import path from "path";
import type {
  MarriageAssessmentResponseRecord,
  MarriageAuditLogRecord,
  MarriageComparisonUnlockRecord,
  MarriageCounselingJourneyRecord,
  MarriageCounselingSessionRecord,
  MarriageCounselorAssignmentRecord,
  MarriageCounselorNoteRecord,
  MarriageDiscussionMarkRecord,
  MarriageJournalEntryRecord,
  MarriageJourneyConsentRecord,
  MarriageJourneyInviteRecord,
  MarriageRevisionRequestRecord,
  MarriageActionPlanRecord,
  MarriageSharedGoalRecord,
  MarriageSharingConsentRecord,
  MarriageActivitySyncSessionRecord,
} from "@/lib/marriage-counseling-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE =
  process.env.MARRIAGE_COUNSELING_DATA_FILE?.trim() ||
  path.join(DATA_DIR, "marriage-counseling.json");

type StoreFile = {
  journeys: MarriageCounselingJourneyRecord[];
  consents: MarriageJourneyConsentRecord[];
  responses: MarriageAssessmentResponseRecord[];
  unlocks: MarriageComparisonUnlockRecord[];
  journal: MarriageJournalEntryRecord[];
  assignments: MarriageCounselorAssignmentRecord[];
  sessions: MarriageCounselingSessionRecord[];
  counselorNotes: MarriageCounselorNoteRecord[];
  discussionMarks: MarriageDiscussionMarkRecord[];
  invites: MarriageJourneyInviteRecord[];
  revisionRequests: MarriageRevisionRequestRecord[];
  auditLogs: MarriageAuditLogRecord[];
  actionPlans: MarriageActionPlanRecord[];
  sharedGoals: MarriageSharedGoalRecord[];
  sharingConsents: MarriageSharingConsentRecord[];
  activitySyncSessions: MarriageActivitySyncSessionRecord[];
};

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return ensureStage2Collections(JSON.parse(raw) as StoreFile);
  } catch {
    return {
      journeys: [],
      consents: [],
      responses: [],
      unlocks: [],
      journal: [],
      assignments: [],
      sessions: [],
      counselorNotes: [],
      discussionMarks: [],
      invites: [],
      revisionRequests: [],
      auditLogs: [],
      actionPlans: [],
      sharedGoals: [],
      sharingConsents: [],
      activitySyncSessions: [],
    };
  }
}

function ensureStage2Collections(store: StoreFile): StoreFile {
  if (!store.actionPlans) store.actionPlans = [];
  if (!store.sharedGoals) store.sharedGoals = [];
  if (!store.sharingConsents) store.sharingConsents = [];
  if (!store.activitySyncSessions) store.activitySyncSessions = [];
  return store;
}

function normalizeJourney(j: MarriageCounselingJourneyRecord): MarriageCounselingJourneyRecord {
  return {
    ...j,
    pairingMode: j.pairingMode ?? (j.coupleLinkId ? "spouse_link" : "journey_invite"),
    participantBId: j.participantBId ?? null,
    guidedModuleIds: j.guidedModuleIds ?? [],
  };
}

async function writeStore(data: StoreFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function listJourneysForCoupleLink(coupleLinkId: string) {
  const store = await readStore();
  return store.journeys
    .filter((j) => j.coupleLinkId === coupleLinkId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getJourneyById(id: string) {
  const store = await readStore();
  const j = store.journeys.find((entry) => entry.id === id);
  return j ? normalizeJourney(j) : null;
}

export async function getActiveJourneyForUser(userId: string) {
  const store = await readStore();
  const active = store.journeys.filter((j) => j.status === "active");
  for (const raw of active) {
    const j = normalizeJourney(raw);
    if (j.participantAId === userId || j.participantBId === userId) return j;
    if (j.coupleLinkId) {
      const { getCoupleLinkById } = await import("@/lib/couple-link-server");
      const link = await getCoupleLinkById(j.coupleLinkId);
      if (link && (link.userAId === userId || link.userBId === userId)) return j;
    }
  }
  return null;
}

export async function getActiveJourneyForCoupleLink(coupleLinkId: string) {
  const journeys = await listJourneysForCoupleLink(coupleLinkId);
  return journeys.find((j) => j.status === "active") ?? null;
}

export async function createJourney(
  input: Omit<MarriageCounselingJourneyRecord, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: MarriageCounselingJourneyRecord = normalizeJourney({
    id: input.id ?? `mj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    programType: input.programType,
    status: input.status,
    currentModuleId: input.currentModuleId,
    counselorUserId: input.counselorUserId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    pairingMode: input.pairingMode,
    participantAId: input.participantAId,
    participantBId: input.participantBId,
    guidedModuleIds: input.guidedModuleIds,
    curriculumVersion: input.curriculumVersion,
  });
  store.journeys.push(record);
  await writeStore(store);
  return record;
}

export async function updateJourney(
  id: string,
  patch: Partial<
    Pick<
      MarriageCounselingJourneyRecord,
      | "status"
      | "currentModuleId"
      | "counselorUserId"
      | "completedAt"
      | "participantBId"
      | "guidedModuleIds"
      | "curriculumVersion"
      | "counselorAccessRevokedAt"
      | "deletionRequestedAt"
    >
  >,
) {
  const store = await readStore();
  const index = store.journeys.findIndex((j) => j.id === id);
  if (index === -1) throw new Error("Journey not found.");
  store.journeys[index] = {
    ...store.journeys[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.journeys[index];
}

export async function upsertConsent(record: MarriageJourneyConsentRecord) {
  const store = await readStore();
  const index = store.consents.findIndex(
    (c) => c.journeyId === record.journeyId && c.userId === record.userId,
  );
  if (index === -1) store.consents.push(record);
  else store.consents[index] = record;
  await writeStore(store);
  return record;
}

export async function getConsentsForJourney(journeyId: string) {
  const store = await readStore();
  return store.consents.filter((c) => c.journeyId === journeyId);
}

export async function getResponse(journeyId: string, moduleId: string, userId: string) {
  const store = await readStore();
  return (
    store.responses.find(
      (r) => r.journeyId === journeyId && r.moduleId === moduleId && r.userId === userId,
    ) ?? null
  );
}

export async function listResponsesForJourneyModule(journeyId: string, moduleId: string) {
  const store = await readStore();
  return store.responses.filter((r) => r.journeyId === journeyId && r.moduleId === moduleId);
}

export async function saveResponse(record: MarriageAssessmentResponseRecord) {
  const store = await readStore();
  const index = store.responses.findIndex((r) => r.id === record.id);
  if (index === -1) store.responses.push(record);
  else store.responses[index] = record;
  await writeStore(store);
  return record;
}

export async function getUnlock(journeyId: string, moduleId: string, contentVersion: string) {
  const store = await readStore();
  return (
    store.unlocks.find(
      (u) =>
        u.journeyId === journeyId &&
        u.moduleId === moduleId &&
        u.contentVersion === contentVersion,
    ) ?? null
  );
}

export async function createUnlock(record: MarriageComparisonUnlockRecord) {
  const store = await readStore();
  if (
    store.unlocks.some(
      (u) =>
        u.journeyId === record.journeyId &&
        u.moduleId === record.moduleId &&
        u.contentVersion === record.contentVersion,
    )
  ) {
    return record;
  }
  store.unlocks.push(record);
  await writeStore(store);
  return record;
}

export async function listJournal(journeyId: string, viewerId: string) {
  const store = await readStore();
  return store.journal
    .filter((e) => e.journeyId === journeyId && (e.visibility === "shared" || e.authorId === viewerId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addJournalEntry(entry: MarriageJournalEntryRecord) {
  const store = await readStore();
  store.journal.push(entry);
  await writeStore(store);
  return entry;
}

export async function listSessions(journeyId: string) {
  const store = await readStore();
  return store.sessions
    .filter((s) => s.journeyId === journeyId && s.status !== "cancelled")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function saveSession(session: MarriageCounselingSessionRecord) {
  const store = await readStore();
  const index = store.sessions.findIndex((s) => s.id === session.id);
  if (index === -1) store.sessions.push(session);
  else store.sessions[index] = session;
  await writeStore(store);
  return session;
}

export async function getSessionById(id: string) {
  const store = await readStore();
  return store.sessions.find((s) => s.id === id) ?? null;
}

export async function listAssignments(journeyId: string) {
  const store = await readStore();
  return store.assignments
    .filter((a) => a.journeyId === journeyId)
    .sort((a, b) => (a.dueAt ?? a.createdAt).localeCompare(b.dueAt ?? b.createdAt));
}

export async function getAssignmentById(id: string) {
  const store = await readStore();
  return store.assignments.find((a) => a.id === id) ?? null;
}

export async function saveAssignment(assignment: MarriageCounselorAssignmentRecord) {
  const store = await readStore();
  const index = store.assignments.findIndex((a) => a.id === assignment.id);
  if (index === -1) store.assignments.push(assignment);
  else store.assignments[index] = assignment;
  await writeStore(store);
  return assignment;
}

export async function listCounselorNotes(journeyId: string) {
  const store = await readStore();
  return store.counselorNotes
    .filter((n) => n.journeyId === journeyId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveCounselorNote(note: MarriageCounselorNoteRecord) {
  const store = await readStore();
  const index = store.counselorNotes.findIndex((n) => n.id === note.id);
  if (index === -1) store.counselorNotes.push(note);
  else store.counselorNotes[index] = note;
  await writeStore(store);
  return note;
}

export async function createInvite(record: MarriageJourneyInviteRecord) {
  const store = await readStore();
  const duplicate = store.invites.find(
    (i) =>
      i.journeyId === record.journeyId &&
      !i.revokedAt &&
      !i.acceptedAt &&
      i.expiresAt > new Date().toISOString(),
  );
  if (duplicate) throw new Error("An active invitation already exists for this journey.");
  store.invites.push(record);
  await writeStore(store);
  return record;
}

export async function getInviteByCode(code: string) {
  const store = await readStore();
  const normalized = code.trim().toUpperCase();
  return store.invites.find((i) => i.code === normalized) ?? null;
}

export async function updateInvite(id: string, patch: Partial<MarriageJourneyInviteRecord>) {
  const store = await readStore();
  const index = store.invites.findIndex((i) => i.id === id);
  if (index === -1) throw new Error("Invite not found.");
  store.invites[index] = { ...store.invites[index], ...patch };
  await writeStore(store);
  return store.invites[index];
}

export async function listInvitesForJourney(journeyId: string) {
  const store = await readStore();
  return store.invites.filter((i) => i.journeyId === journeyId);
}

export async function createRevisionRequest(record: MarriageRevisionRequestRecord) {
  const store = await readStore();
  store.revisionRequests.push(record);
  await writeStore(store);
  return record;
}

export async function updateRevisionRequest(id: string, patch: Partial<MarriageRevisionRequestRecord>) {
  const store = await readStore();
  const index = store.revisionRequests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Revision request not found.");
  store.revisionRequests[index] = { ...store.revisionRequests[index], ...patch };
  await writeStore(store);
  return store.revisionRequests[index];
}

export async function listRevisionRequests(journeyId: string) {
  const store = await readStore();
  return store.revisionRequests.filter((r) => r.journeyId === journeyId);
}

export async function getRevisionRequestById(id: string) {
  const store = await readStore();
  return store.revisionRequests.find((r) => r.id === id) ?? null;
}

export async function appendAuditLog(record: MarriageAuditLogRecord) {
  const store = await readStore();
  store.auditLogs.push(record);
  if (store.auditLogs.length > 5000) {
    store.auditLogs = store.auditLogs.slice(-5000);
  }
  await writeStore(store);
  return record;
}

export async function listAuditLogs(journeyId?: string) {
  const store = await readStore();
  return store.auditLogs
    .filter((l) => (journeyId ? l.journeyId === journeyId : true))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 200);
}

export async function archiveJourneyData(journeyId: string) {
  const store = await readStore();
  const index = store.journeys.findIndex((j) => j.id === journeyId);
  if (index === -1) throw new Error("Journey not found.");
  store.journeys[index].status = "archived";
  store.journeys[index].updatedAt = new Date().toISOString();
  await writeStore(store);
  return store.journeys[index];
}

export async function listJourneysForCounselor(counselorUserId: string) {
  const store = await readStore();
  return store.journeys.filter(
    (j) => j.counselorUserId === counselorUserId && j.status !== "archived",
  );
}

export async function listAllActiveJourneys() {
  const store = await readStore();
  return store.journeys.filter((j) => j.status === "active");
}

export async function upsertDiscussionMark(mark: MarriageDiscussionMarkRecord) {
  const store = await readStore();
  const index = store.discussionMarks.findIndex(
    (m) =>
      m.journeyId === mark.journeyId &&
      m.moduleId === mark.moduleId &&
      m.questionId === mark.questionId &&
      m.markedByUserId === mark.markedByUserId,
  );
  if (index === -1) store.discussionMarks.push(mark);
  else store.discussionMarks[index] = mark;
  await writeStore(store);
  return mark;
}

export async function getDiscussionMarks(journeyId: string, moduleId: string) {
  const store = await readStore();
  return store.discussionMarks.filter((m) => m.journeyId === journeyId && m.moduleId === moduleId);
}

export async function reopenDiscussionForQuestion(
  journeyId: string,
  moduleId: string,
  questionId: string,
) {
  const store = await readStore();
  let cleared = 0;
  const next: typeof store.discussionMarks = [];
  for (const m of store.discussionMarks) {
    if (m.journeyId !== journeyId || m.moduleId !== moduleId || m.questionId !== questionId) {
      next.push(m);
      continue;
    }
    if (m.sharedNote?.trim()) {
      next.push({ ...m, discussedAt: null });
      cleared += 1;
    }
  }
  store.discussionMarks = next;
  await writeStore(store);
  return cleared;
}

export async function listActionPlans(journeyId: string) {
  const store = await readStore();
  return store.actionPlans
    .filter((p) => p.journeyId === journeyId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getActionPlanById(id: string) {
  const store = await readStore();
  return store.actionPlans.find((p) => p.id === id) ?? null;
}

export async function saveActionPlan(plan: MarriageActionPlanRecord) {
  const store = await readStore();
  const index = store.actionPlans.findIndex((p) => p.id === plan.id);
  if (index === -1) store.actionPlans.push(plan);
  else store.actionPlans[index] = plan;
  await writeStore(store);
  return plan;
}

export async function listSharedGoals(journeyId: string) {
  const store = await readStore();
  return store.sharedGoals
    .filter((g) => g.journeyId === journeyId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSharedGoalById(id: string) {
  const store = await readStore();
  return store.sharedGoals.find((g) => g.id === id) ?? null;
}

export async function saveSharedGoal(goal: MarriageSharedGoalRecord) {
  const store = await readStore();
  const index = store.sharedGoals.findIndex((g) => g.id === goal.id);
  if (index === -1) store.sharedGoals.push(goal);
  else store.sharedGoals[index] = goal;
  await writeStore(store);
  return goal;
}

export async function listSharingConsents(journeyId: string, moduleId: string) {
  const store = await readStore();
  return store.sharingConsents.filter((c) => c.journeyId === journeyId && c.moduleId === moduleId);
}

export async function saveSharingConsent(record: MarriageSharingConsentRecord) {
  const store = await readStore();
  const index = store.sharingConsents.findIndex(
    (c) =>
      c.journeyId === record.journeyId &&
      c.moduleId === record.moduleId &&
      c.questionId === record.questionId &&
      c.userId === record.userId,
  );
  if (index === -1) store.sharingConsents.push(record);
  else store.sharingConsents[index] = record;
  await writeStore(store);
  return record;
}

export async function getActivitySyncSession(journeyId: string, moduleId: string) {
  const store = await readStore();
  return (
    store.activitySyncSessions.find(
      (s) => s.journeyId === journeyId && s.moduleId === moduleId && s.status === "open",
    ) ?? null
  );
}

export async function saveActivitySyncSession(session: MarriageActivitySyncSessionRecord) {
  const store = await readStore();
  const index = store.activitySyncSessions.findIndex((s) => s.id === session.id);
  if (index === -1) store.activitySyncSessions.push(session);
  else store.activitySyncSessions[index] = session;
  await writeStore(store);
  return session;
}
