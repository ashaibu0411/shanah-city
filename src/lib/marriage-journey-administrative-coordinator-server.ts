import type { PublicMember } from "@/lib/auth-types";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import {
  assertSeniorPastor,
  isSeniorPastor,
} from "@/lib/marriage-counselor-assignment-authority";
import { assignmentAdminIdsFromEnv } from "@/lib/marriage-journey-administrative-coordinator-policy";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function assertAssignmentAdminOnJourney(
  viewer: Pick<PublicMember, "id">,
  journeyId: string,
): Promise<void> {
  if (await isSeniorPastor(viewer)) return;
  const row = await store().getJourneyAdministrativeCoordinator(journeyId);
  if (!row || row.coordinatorUserId !== viewer.id) {
    throw new Error("Not authorized for this couple.");
  }
}

export async function assignAdministrativeCoordinator(
  seniorPastor: PublicMember,
  input: { journeyId: string; coordinatorUserId: string },
) {
  await assertSeniorPastor(seniorPastor);

  const coordinatorUserId = input.coordinatorUserId.trim();
  if (!coordinatorUserId) throw new Error("Coordinator is required.");
  if (!assignmentAdminIdsFromEnv().has(coordinatorUserId)) {
    throw new Error("User is not an authorized assignment admin.");
  }
  if (coordinatorUserId === seniorPastor.id) {
    throw new Error("Senior Pastor cannot be assigned as administrative coordinator.");
  }

  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");

  const previous = await store().getJourneyAdministrativeCoordinator(input.journeyId);
  const now = new Date().toISOString();

  await store().setJourneyAdministrativeCoordinator({
    journeyId: input.journeyId,
    coordinatorUserId,
    assignedByUserId: seniorPastor.id,
    assignedAt: now,
  });

  await logMarriageAudit({
    actorUserId: seniorPastor.id,
    action: previous
      ? "administrative_coordinator_reassigned"
      : "administrative_coordinator_assigned",
    journeyId: input.journeyId,
    targetUserId: coordinatorUserId,
    meta: {
      previousCoordinatorUserId: previous?.coordinatorUserId ?? "",
    },
  });

  const { notifyAdministrativeCoordinatorAssigned } = await import(
    "@/lib/marriage-prep-notification-triggers"
  );
  void notifyAdministrativeCoordinatorAssigned(journey, coordinatorUserId);

  return { ok: true as const };
}

export async function removeAdministrativeCoordinator(
  seniorPastor: PublicMember,
  journeyId: string,
) {
  await assertSeniorPastor(seniorPastor);

  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");

  const previous = await store().getJourneyAdministrativeCoordinator(journeyId);
  if (!previous) throw new Error("No administrative coordinator is assigned.");

  await store().removeJourneyAdministrativeCoordinator(journeyId);

  await logMarriageAudit({
    actorUserId: seniorPastor.id,
    action: "administrative_coordinator_removed",
    journeyId,
    targetUserId: previous.coordinatorUserId,
  });

  return { ok: true as const };
}

export async function listActiveJourneysForAssignmentAdminViewer(viewer: PublicMember) {
  if (await isSeniorPastor(viewer)) {
    return store().listAllActiveJourneys();
  }
  return store().listActiveJourneysForAdministrativeCoordinator(viewer.id);
}
