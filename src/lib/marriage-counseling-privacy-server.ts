import type { PublicMember } from "@/lib/auth-types";
import {
  assertClinicalCounselorForJourney,
  assertJourneyParticipantLoose,
} from "@/lib/marriage-counseling-access";
import {
  archiveJourneyAfterDeletionReview,
  journeyHasPendingDeletionRequest,
} from "@/lib/marriage-deletion-request-admin";
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
  if (journeyHasPendingDeletionRequest(journey)) {
    return {
      ok: true,
      alreadyPending: true,
      message:
        "A pastoral review request is already on file for this journey. Staff will follow up when possible.",
    };
  }
  await store().updateJourney(journeyId, {
    deletionRequestedAt: new Date().toISOString(),
  });
  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "journey_deletion_requested",
    journeyId,
  });
  return {
    ok: true,
    message:
      "Your request was sent for pastoral review. Staff may archive the journey after confirmation; this does not permanently erase records.",
  };
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
  return archiveJourneyAfterDeletionReview(admin, journeyId);
}

export async function listJourneyAuditForCounselor(counselor: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(counselor, journey);
  return store().listAuditLogs(journeyId);
}
