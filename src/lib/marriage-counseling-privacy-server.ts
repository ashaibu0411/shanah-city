import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import {
  assertClinicalCounselorForJourney,
  assertJourneyParticipantLoose,
  isMarriageCounselor,
} from "@/lib/marriage-counseling-access";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import { listModulesForJourney } from "@/lib/marriage-curriculum-service";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function exportJourneyData(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);

  const modules = await listModulesForJourney(journey);
  const myResponses = [];
  for (const mod of modules) {
    const response = await store().getResponse(journey.id, mod.id, viewer.id);
    if (response) {
      myResponses.push({
        moduleId: mod.id,
        moduleTitle: mod.title,
        contentVersion: response.contentVersion,
        status: response.status,
        answers: response.answers,
        submittedAt: response.submittedAt,
      });
    }
  }

  const journal = await store().listJournal(journey.id, viewer.id);
  const assignments = await store().listAssignments(journey.id);
  const sessions = await store().listSessions(journey.id);

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "journey_export",
    journeyId,
  });

  return {
    exportedAt: new Date().toISOString(),
    journey: {
      id: journey.id,
      programType: journey.programType,
      status: journey.status,
      curriculumVersion: journey.curriculumVersion,
    },
    responses: myResponses,
    journal,
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueAt: a.dueAt,
      completed: a.completedByUserIds.includes(viewer.id),
    })),
    sessions: sessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      topic: s.topic,
      status: s.status,
      zoomUrl: s.zoomUrl,
    })),
  };
}

export async function requestJourneyDeletion(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  await store().updateJourney(journeyId, {
    deletionRequestedAt: new Date().toISOString(),
  });
  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "journey_deletion_requested",
    journeyId,
  });
  return { ok: true, message: "Deletion request recorded. Pastoral staff will confirm." };
}

export async function revokeCounselorAccess(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);

  const { useDatabase } = await import("@/lib/use-database");
  if (useDatabase()) {
    const db = await import("@/lib/stores/marriage-counseling-db");
    await db.revokeParticipantCounselorAccessInTransaction(journeyId, viewer.id);
  } else {
    const json = await import("@/lib/stores/marriage-counseling-json");
    await json.revokeParticipantCounselorAccessAtomic(journeyId, viewer.id);
  }

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "counselor_access_revoked",
    journeyId,
  });
  return { ok: true };
}

export async function adminArchiveJourney(admin: PublicMember, journeyId: string) {
  if (!(await canManageAsAdmin(admin)) && !(await isMarriageCounselor(admin))) {
    throw new Error("Not authorized.");
  }
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (!journey.deletionRequestedAt && !(await canManageAsAdmin(admin))) {
    throw new Error("Deletion must be requested by participants first.");
  }
  await store().archiveJourneyData(journeyId);
  await logMarriageAudit({
    actorUserId: admin.id,
    action: "journey_archived",
    journeyId,
  });
  return { ok: true };
}

export async function listJourneyAuditForCounselor(counselor: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(counselor, journey);
  return store().listAuditLogs(journeyId);
}
