import type { PublicMember } from "@/lib/auth-types";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import { resolveJourneyPartnerId } from "@/lib/marriage-counseling-participants";
import type { MarriageActivitySyncSessionRecord } from "@/lib/marriage-counseling-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function startActivitySyncSession(viewer: PublicMember, moduleId: string) {
  const journey = await store().getActiveJourneyForUser(viewer.id);
  if (!journey) throw new Error("No active journey.");
  await assertJourneyParticipantLoose(journey, viewer.id);

  const existing = await store().getActivitySyncSession(journey.id, moduleId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const session: MarriageActivitySyncSessionRecord = {
    id: `mas-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: journey.id,
    moduleId,
    startedByUserId: viewer.id,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  await store().saveActivitySyncSession(session);
  return session;
}

/** Progress only — never includes answer bodies. */
export async function getActivitySyncStatus(viewer: PublicMember, moduleId: string) {
  const journey = await store().getActiveJourneyForUser(viewer.id);
  if (!journey) throw new Error("No active journey.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  const partnerId = await resolveJourneyPartnerId(journey, viewer.id);

  const myResponse = await store().getResponse(journey.id, moduleId, viewer.id);
  const partnerResponse = partnerId
    ? await store().getResponse(journey.id, moduleId, partnerId)
    : null;

  const session = await store().getActivitySyncSession(journey.id, moduleId);
  const contentVersion = myResponse?.contentVersion ?? partnerResponse?.contentVersion;
  const unlock = contentVersion
    ? await store().getUnlock(journey.id, moduleId, contentVersion)
    : null;

  return {
    sessionId: session?.id ?? null,
    myStatus: myResponse?.status ?? "not_started",
    partnerStatus: partnerResponse?.status ?? "not_started",
    comparisonUnlocked: Boolean(unlock),
    partnerJoined: Boolean(partnerId),
  };
}
