import type { PublicMember } from "@/lib/auth-types";
import { getUserByEmail } from "@/lib/auth-server";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import {
  getActiveContentVersionLabel,
  listModulesForJourney,
} from "@/lib/marriage-curriculum-service";
import { notifyMarriagePartnerJoined } from "@/lib/marriage-counseling-notify";
import { MARRIAGE_CONSENT_VERSION } from "@/lib/marriage-counseling-curriculum";
import type { MarriageProgramType } from "@/lib/marriage-counseling-types";
import {
  MARRIAGE_ACTIVE_JOURNEY_CONFLICT,
  buildJourneyEngagement,
  isAbandonedInviteShell,
  isSpouseLinkedJourney,
  participantHasOtherActiveJourney,
  pickHubActiveJourneyFromEngagements,
  resolveHubActiveJourneyForUser,
} from "@/lib/marriage-active-journey-lifecycle";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function findOpenInviteForJourney(journeyId: string) {
  const invites = await store().listInvitesForJourney(journeyId);
  return (
    invites.find(
      (i) => !i.revokedAt && !i.acceptedAt && new Date(i.expiresAt).getTime() > Date.now(),
    ) ?? null
  );
}

export async function startJourneyWithInvite(
  viewer: PublicMember,
  programType: MarriageProgramType,
  options?: { intendedEmail?: string; counselorUserId?: string | null },
) {
  const actives = await store().listActiveJourneysForUser(viewer.id);
  const hubJourney = await resolveHubActiveJourneyForUser(viewer.id, actives);
  if (hubJourney) {
    if (isSpouseLinkedJourney(hubJourney)) {
      throw new Error(MARRIAGE_ACTIVE_JOURNEY_CONFLICT);
    }
    const invite = await findOpenInviteForJourney(hubJourney.id);
    return { journey: hubJourney, invite };
  }

  const engagements = await Promise.all(actives.map((j) => buildJourneyEngagement(j)));
  const abandonedOnly = engagements.filter((e) =>
    isAbandonedInviteShell(e.journey, e.meaningfulActivityCount),
  );
  if (abandonedOnly.length > 0) {
    const sorted = [...abandonedOnly].sort((a, b) =>
      b.journey.createdAt.localeCompare(a.journey.createdAt),
    );
    const journey = sorted[0]!.journey;
    let invite = await findOpenInviteForJourney(journey.id);
    if (!invite) {
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      invite = await store().createInvite({
        id: `mji-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: generateInviteCode(),
        journeyId: journey.id,
        createdBy: viewer.id,
        intendedEmail: options?.intendedEmail?.trim().toLowerCase(),
        expiresAt,
        createdAt: new Date().toISOString(),
      });
    }
    return { journey, invite };
  }

  const nonHubActives = engagements.filter(
    (e) => !isAbandonedInviteShell(e.journey, e.meaningfulActivityCount),
  );
  if (nonHubActives.length > 0) {
    const conflict = pickHubActiveJourneyFromEngagements(nonHubActives);
    if (conflict) {
      throw new Error(MARRIAGE_ACTIVE_JOURNEY_CONFLICT);
    }
  }

  const { getProgramTrackEntries } = await import("@/lib/marriage-curriculum-service");
  const track = await getProgramTrackEntries(programType);
  const firstModule = track[0]?.moduleId ?? null;
  const curriculumVersion = await getActiveContentVersionLabel();

  const journey = await store().createJourney({
    coupleLinkId: "",
    programType,
    status: "active",
    currentModuleId: firstModule,
    counselorUserId: options?.counselorUserId ?? null,
    createdBy: viewer.id,
    pairingMode: "journey_invite",
    participantAId: viewer.id,
    participantBId: null,
    curriculumVersion,
  });

  await store().upsertConsent({
    journeyId: journey.id,
    userId: viewer.id,
    consentVersion: MARRIAGE_CONSENT_VERSION,
    consentedAt: new Date().toISOString(),
  });

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const invite = await store().createInvite({
    id: `mji-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code: generateInviteCode(),
    journeyId: journey.id,
    createdBy: viewer.id,
    intendedEmail: options?.intendedEmail?.trim().toLowerCase(),
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "journey_invite_created",
    journeyId: journey.id,
    meta: { programType },
  });

  return { journey, invite };
}

export async function acceptJourneyInvite(viewer: PublicMember, code: string) {
  const invite = await store().getInviteByCode(code);
  if (!invite) throw new Error("Invalid invitation code.");
  if (invite.revokedAt) throw new Error("This invitation was revoked.");
  if (invite.acceptedAt) throw new Error("This invitation was already used.");
  if (new Date(invite.expiresAt).getTime() < Date.now()) throw new Error("This invitation expired.");

  const journey = await store().getJourneyById(invite.journeyId);
  if (!journey || journey.status !== "active") throw new Error("Journey not available.");

  if (journey.participantBId && journey.participantBId !== viewer.id) {
    throw new Error("This journey already has a partner.");
  }
  if (journey.participantAId === viewer.id) {
    throw new Error("You cannot accept your own invitation.");
  }

  if (invite.intendedEmail) {
    const email = viewer.email?.trim().toLowerCase();
    if (email !== invite.intendedEmail) {
      throw new Error("This invitation was sent to a different email address.");
    }
  }

  const actives = await store().listActiveJourneysForUser(viewer.id);
  if (participantHasOtherActiveJourney(actives, viewer.id, journey.id)) {
    throw new Error("You already have an active counseling journey.");
  }

  await store().updateJourney(journey.id, { participantBId: viewer.id });
  await store().updateInvite(invite.id, {
    acceptedByUserId: viewer.id,
    acceptedAt: new Date().toISOString(),
  });

  await store().upsertConsent({
    journeyId: journey.id,
    userId: viewer.id,
    consentVersion: MARRIAGE_CONSENT_VERSION,
    consentedAt: new Date().toISOString(),
  });

  notifyMarriagePartnerJoined(journey.participantAId ?? journey.createdBy);

  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "journey_invite_accepted",
    journeyId: journey.id,
  });

  return store().getJourneyById(journey.id);
}

export async function revokeJourneyInvite(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  if (journey.participantAId !== viewer.id && journey.createdBy !== viewer.id) {
    throw new Error("Only the journey host can revoke invitations.");
  }
  const invites = await store().listInvitesForJourney(journeyId);
  const active = invites.find((i) => !i.revokedAt && !i.acceptedAt);
  if (!active) throw new Error("No active invitation.");
  await store().updateInvite(active.id, { revokedAt: new Date().toISOString() });
  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "journey_invite_revoked",
    journeyId,
  });
  return { ok: true };
}

export async function getPendingInviteCodeForJourney(journeyId: string) {
  const invites = await store().listInvitesForJourney(journeyId);
  const active = invites.find(
    (i) => !i.revokedAt && !i.acceptedAt && new Date(i.expiresAt).getTime() > Date.now(),
  );
  return active?.code ?? null;
}

export async function createCounselorJourneyInvite(
  counselor: PublicMember,
  input: {
    programType: MarriageProgramType;
    participantEmail: string;
    guidedModuleIds?: string[];
  },
) {
  const participant = await getUserByEmail(input.participantEmail.trim().toLowerCase());
  if (!participant) throw new Error("No member found with that email.");

  const { assertParticipantsMayStartNewJourney } = await import(
    "@/lib/marriage-active-journey-lifecycle"
  );
  await assertParticipantsMayStartNewJourney({
    participantUserIds: [participant.id],
  });

  const curriculumVersion = await getActiveContentVersionLabel();
  const journey = await store().createJourney({
    coupleLinkId: "",
    programType: input.programType,
    status: "active",
    currentModuleId: null,
    counselorUserId: counselor.id,
    createdBy: counselor.id,
    pairingMode: "journey_invite",
    participantAId: participant.id,
    participantBId: null,
    guidedModuleIds: input.guidedModuleIds,
    curriculumVersion,
  });

  const modules = await listModulesForJourney(journey);
  if (modules[0]) {
    await store().updateJourney(journey.id, { currentModuleId: modules[0].id });
  }

  const invite = await store().createInvite({
    id: `mji-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    code: generateInviteCode(),
    journeyId: journey.id,
    createdBy: counselor.id,
    intendedEmail: participant.email?.toLowerCase(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  });

  await logMarriageAudit({
    actorUserId: counselor.id,
    action: "counselor_journey_created",
    journeyId: journey.id,
    targetUserId: participant.id,
  });

  return { journey, invite, participantName: participant.name };
}
