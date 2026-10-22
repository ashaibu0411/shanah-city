import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import { isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import { resolveCoupleDisplayNames } from "@/lib/marriage-counselor-journey-names";
import { assignmentAdminIdsFromEnv } from "@/lib/marriage-journey-administrative-coordinator-policy";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export type MarriageDeletionRequestQueueRow = {
  journeyId: string;
  coupleNames: string;
  programType: string;
  deletionRequestedAt: string;
  status: string;
};

export async function canReviewJourneyDeletionRequests(
  user: Pick<PublicMember, "id">,
): Promise<boolean> {
  if (await isSeniorPastor(user)) return true;
  if (await canManageAsAdmin(user)) return true;
  if (assignmentAdminIdsFromEnv().has(user.id)) return true;
  return false;
}

export async function assertCanReviewJourneyDeletionRequests(
  user: Pick<PublicMember, "id">,
): Promise<void> {
  if (!(await canReviewJourneyDeletionRequests(user))) {
    throw new Error("Not authorized to review journey deletion requests.");
  }
}

export async function listPendingJourneyDeletionRequests(
  reviewer: PublicMember,
): Promise<MarriageDeletionRequestQueueRow[]> {
  await assertCanReviewJourneyDeletionRequests(reviewer);
  const journeys = await store().listJourneysWithPendingDeletionRequest();
  const rows: MarriageDeletionRequestQueueRow[] = [];
  for (const journey of journeys) {
    if (!journey.deletionRequestedAt) continue;
    rows.push({
      journeyId: journey.id,
      coupleNames: await resolveCoupleDisplayNames(journey),
      programType: journey.programType,
      deletionRequestedAt: journey.deletionRequestedAt,
      status: journey.status,
    });
  }
  return rows;
}

export async function dismissJourneyDeletionRequest(reviewer: PublicMember, journeyId: string) {
  await assertCanReviewJourneyDeletionRequests(reviewer);
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (!journey.deletionRequestedAt) {
    throw new Error("No pending deletion request for this journey.");
  }
  await store().updateJourney(journeyId, { deletionRequestedAt: null });
  await logMarriageAudit({
    actorUserId: reviewer.id,
    action: "journey_deletion_dismissed",
    journeyId,
    meta: { previousDeletionRequestedAt: journey.deletionRequestedAt },
  });
  return { ok: true as const };
}

export async function archiveJourneyAfterDeletionReview(reviewer: PublicMember, journeyId: string) {
  await assertCanReviewJourneyDeletionRequests(reviewer);
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  if (!journey.deletionRequestedAt) {
    throw new Error("Deletion must be requested by participants before archival.");
  }
  if (journey.status === "archived") {
    throw new Error("Journey is already archived.");
  }
  await store().archiveJourneyData(journeyId);
  await logMarriageAudit({
    actorUserId: reviewer.id,
    action: "journey_archived",
    journeyId,
    meta: {
      approvedByUserId: reviewer.id,
      deletionRequestedAt: journey.deletionRequestedAt,
    },
  });
  return { ok: true as const };
}

export function journeyHasPendingDeletionRequest(journey: MarriageCounselingJourneyRecord | null) {
  return Boolean(journey?.status === "active" && journey.deletionRequestedAt);
}
