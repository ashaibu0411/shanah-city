import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export function userParticipatedInJourney(
  userId: string,
  journey: MarriageCounselingJourneyRecord,
): boolean {
  return journey.participantAId === userId || journey.participantBId === userId;
}

/** Invite-only shell with no partner and no assessment activity (Stage 1 or Stage 2). */
export function isAbandonedInviteShell(
  journey: MarriageCounselingJourneyRecord,
  meaningfulActivityCount: number,
): boolean {
  if (journey.status !== "active") return false;
  if (journey.participantBId) return false;
  if (meaningfulActivityCount > 0) return false;
  const mode = journey.pairingMode ?? (journey.coupleLinkId?.trim() ? "spouse_link" : "journey_invite");
  return mode === "journey_invite";
}

export function isSpouseLinkedJourney(journey: MarriageCounselingJourneyRecord): boolean {
  const mode = journey.pairingMode ?? (journey.coupleLinkId?.trim() ? "spouse_link" : "journey_invite");
  return mode === "spouse_link" || Boolean(journey.coupleLinkId?.trim());
}

export async function countSubmittedResponsesForJourney(journeyId: string): Promise<number> {
  return store().countSubmittedResponsesForJourney(journeyId);
}

export async function countMeaningfulAssessmentActivityForJourney(
  journeyId: string,
): Promise<number> {
  return store().countMeaningfulAssessmentActivityForJourney(journeyId);
}

export type JourneyEngagement = {
  journey: MarriageCounselingJourneyRecord;
  submittedResponseCount: number;
  meaningfulActivityCount: number;
};

export async function buildJourneyEngagement(
  journey: MarriageCounselingJourneyRecord,
): Promise<JourneyEngagement> {
  const [submittedResponseCount, meaningfulActivityCount] = await Promise.all([
    countSubmittedResponsesForJourney(journey.id),
    countMeaningfulAssessmentActivityForJourney(journey.id),
  ]);
  return {
    journey,
    submittedResponseCount,
    meaningfulActivityCount,
  };
}

/**
 * Suppress empty invite-only shells when this participant previously had a substantive journey archived.
 * Does not change journey status in storage.
 */
export async function shouldSuppressAbandonedInviteShell(
  userId: string,
  journey: MarriageCounselingJourneyRecord,
  meaningfulActivityCount: number,
): Promise<boolean> {
  if (!userParticipatedInJourney(userId, journey)) return false;
  if (!isAbandonedInviteShell(journey, meaningfulActivityCount)) return false;
  const archived = await store().listArchivedJourneysForUser(userId);
  for (const past of archived) {
    if (!userParticipatedInJourney(userId, past)) continue;
    if (isSpouseLinkedJourney(past)) return true;
    const pastActivity = await countMeaningfulAssessmentActivityForJourney(past.id);
    if (pastActivity > 0) return true;
  }
  return false;
}

/** Hub-visible actives; optionally drops suppressed abandoned invite shells. */
export async function filterHubEligibleEngagements(
  userId: string,
  engagements: JourneyEngagement[],
): Promise<JourneyEngagement[]> {
  const kept: JourneyEngagement[] = [];
  for (const e of engagements) {
    if (
      isAbandonedInviteShell(e.journey, e.meaningfulActivityCount) &&
      (await shouldSuppressAbandonedInviteShell(
        userId,
        e.journey,
        e.meaningfulActivityCount,
      ))
    ) {
      continue;
    }
    kept.push(e);
  }
  return kept;
}

/**
 * Deterministic pick among hub-eligible active journeys (engagement, partner, link mode, recency).
 */
export function pickHubActiveJourneyFromEngagements(
  engagements: JourneyEngagement[],
): MarriageCounselingJourneyRecord | null {
  if (engagements.length === 0) return null;
  if (engagements.length === 1) return engagements[0]!.journey;

  const sorted = [...engagements].sort((a, b) => {
    if (b.submittedResponseCount !== a.submittedResponseCount) {
      return b.submittedResponseCount - a.submittedResponseCount;
    }
    const bPartner = b.journey.participantBId ? 1 : 0;
    const aPartner = a.journey.participantBId ? 1 : 0;
    if (bPartner !== aPartner) return bPartner - aPartner;
    const bLink = isSpouseLinkedJourney(b.journey) ? 1 : 0;
    const aLink = isSpouseLinkedJourney(a.journey) ? 1 : 0;
    if (bLink !== aLink) return bLink - aLink;
    return b.journey.createdAt.localeCompare(a.journey.createdAt);
  });
  return sorted[0]!.journey;
}

export async function resolveHubActiveJourneyForUser(
  userId: string,
  actives: MarriageCounselingJourneyRecord[],
): Promise<MarriageCounselingJourneyRecord | null> {
  const mine = actives.filter((j) => userParticipatedInJourney(userId, j));
  if (mine.length === 0) return null;
  const engagements = await Promise.all(mine.map((j) => buildJourneyEngagement(j)));
  const eligible = await filterHubEligibleEngagements(userId, engagements);
  return pickHubActiveJourneyFromEngagements(eligible);
}

/** Full active list — use for creation/accept invariants, not hub resolution alone. */
export function participantHasOtherActiveJourney(
  actives: MarriageCounselingJourneyRecord[],
  userId: string,
  exceptJourneyId: string,
): boolean {
  return actives.some(
    (j) => j.id !== exceptJourneyId && userParticipatedInJourney(userId, j),
  );
}

export const MARRIAGE_ACTIVE_JOURNEY_CONFLICT =
  "An active Marriage Prep journey already exists for this account. Request pastoral review to archive it before starting another.";

export const MARRIAGE_SPOUSE_ACTIVE_JOURNEY_CONFLICT =
  "Your linked spouse already has an active Marriage Prep journey. Both partners must use one journey at a time.";

export const MARRIAGE_INVITE_BLOCK_SPOUSE_LINK =
  "You already have an invitation-only Marriage Prep journey on file. Share that code with your partner, or ask pastoral staff to review archiving it before starting a spouse-linked journey.";

export async function assertParticipantsMayStartNewJourney(input: {
  participantUserIds: string[];
  allowJourneyId?: string | null;
  coupleLinkId?: string | null;
}): Promise<void> {
  const allowId = input.allowJourneyId?.trim() || null;
  const coupleLinkId = input.coupleLinkId?.trim() || null;

  for (const userId of input.participantUserIds) {
    if (!userId?.trim()) continue;
    const actives = await store().listActiveJourneysForUser(userId);
    for (const journey of actives) {
      if (allowId && journey.id === allowId) continue;
      if (coupleLinkId && journey.coupleLinkId === coupleLinkId) continue;
      if (!userParticipatedInJourney(userId, journey)) continue;

      const meaningful = await countMeaningfulAssessmentActivityForJourney(journey.id);

      if (coupleLinkId && !isSpouseLinkedJourney(journey)) {
        if (userId === journey.participantAId || userId === journey.createdBy) {
          throw new Error(MARRIAGE_INVITE_BLOCK_SPOUSE_LINK);
        }
        throw new Error(MARRIAGE_SPOUSE_ACTIVE_JOURNEY_CONFLICT);
      }

      if (isAbandonedInviteShell(journey, meaningful)) {
        if (userId === journey.participantAId || userId === journey.createdBy) {
          throw new Error(MARRIAGE_INVITE_BLOCK_SPOUSE_LINK);
        }
        continue;
      }
      throw new Error(
        userId === input.participantUserIds[0]
          ? MARRIAGE_ACTIVE_JOURNEY_CONFLICT
          : MARRIAGE_SPOUSE_ACTIVE_JOURNEY_CONFLICT,
      );
    }
  }
}
