import { randomUUID } from "crypto";
import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import { assertClinicalCounselorForJourney } from "@/lib/marriage-counseling-access";
import { assertSeniorPastor, isSeniorPastor } from "@/lib/marriage-counselor-assignment-authority";
import { logMarriageAudit } from "@/lib/marriage-counseling-audit";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import {
  computeFinalCertificateBlockers,
  resolveSessionCompletionDate,
  sessionCertificateReference,
  suggestProgramCompletionDate,
} from "@/lib/marriage-certificate-eligibility";
import {
  renderFinalProgramCertificatePdf,
  renderSessionCompletionCertificatePdf,
} from "@/lib/marriage-certificate-pdf";
import type {
  MarriageCoupleCertificatesGalleryView,
  MarriageFinalCertificateEligibilityView,
} from "@/lib/marriage-certificate-types";
import { PREMARITAL_PROGRAM_SESSIONS, getPremaritalSessionDefinition } from "@/lib/marriage-premarital-eight-session-program";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import { PASTORAL_ROLE_LABELS, userIdForPastoralRole } from "@/lib/pastoral-roles-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

async function partnerDisplayNames(journey: MarriageCounselingJourneyRecord) {
  const a = journey.participantAId ? await getUserById(journey.participantAId) : null;
  const b = journey.participantBId ? await getUserById(journey.participantBId) : null;
  return {
    partnerA: a?.displayName?.trim() || "Partner A",
    partnerB: b?.displayName?.trim() || "Partner B",
  };
}

async function seniorPastorSigningInfo() {
  const assignments = await getPastoralRoleAssignments();
  const spId = userIdForPastoralRole("senior_pastor", assignments);
  const user = spId ? await getUserById(spId) : null;
  return {
    name: user?.displayName?.trim() || "Senior Pastor",
    title: PASTORAL_ROLE_LABELS.senior_pastor,
  };
}

function newCertificateNumber() {
  const year = new Date().getFullYear();
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MP-${year}-${suffix}`;
}

export async function buildCoupleCertificatesGallery(
  viewer: PublicMember,
  journey: MarriageCounselingJourneyRecord,
): Promise<MarriageCoupleCertificatesGalleryView> {
  await assertJourneyParticipantLoose(journey, viewer.id);
  const records = await store().listPremaritalProgramSessionsForJourney(journey.id);
  const clinical = await store().listPremaritalSessionClinicalForJourney(journey.id);

  const sessionMilestones = PREMARITAL_PROGRAM_SESSIONS.map((def) => {
    const row = records.find((r) => r.sessionKey === def.sessionKey) ?? null;
    const clin = clinical.find((c) => c.sessionKey === def.sessionKey) ?? null;
    const unlocked = row?.status === "completed";
    const resolved = resolveSessionCompletionDate({
      programRow: row,
      clinicalSessionDate: clin?.sessionDate ?? null,
    });
    return {
      sessionKey: def.sessionKey,
      order: def.order,
      title: def.title,
      unlocked,
      completionDate: resolved.date,
      completionDateMissing: unlocked && resolved.missing,
      certificateReference: sessionCertificateReference(journey.id, def.sessionKey),
    };
  });

  const blockers = await computeFinalCertificateBlockers(journey);
  const activeBlocker = blockers.find((b) => b.startsWith("An active final"));
  const eligibilityBlockers = blockers.filter((b) => !b.startsWith("An active final"));
  const certs = await store().listFinalCertificatesForJourney(journey.id);
  const active = certs.find((c) => c.status === "active") ?? null;
  const revoked = certs.find((c) => c.status === "revoked") ?? null;

  let finalStatus: MarriageCoupleCertificatesGalleryView["finalCertificate"]["status"] = "not_eligible";
  if (active) finalStatus = "issued";
  else if (revoked && !active) finalStatus = "revoked";
  else if (eligibilityBlockers.length === 0) finalStatus = "eligible_pending_issue";

  return {
    sessionMilestones,
    finalCertificate: {
      status: finalStatus,
      certificateNumber: active?.certificateNumber ?? null,
      issuedAt: active?.issuedAt ?? null,
      canDownload: Boolean(active),
      eligibilitySummary: eligibilityBlockers.slice(0, 6),
    },
  };
}

export async function generateSessionCertificatePdfForViewer(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);

  const def = getPremaritalSessionDefinition(sessionKey);
  if (!def) throw new Error("Unknown session.");

  const records = await store().listPremaritalProgramSessionsForJourney(journeyId);
  const row = records.find((r) => r.sessionKey === sessionKey);
  if (!row || row.status !== "completed") {
    throw new Error("Session certificate unlocks after counselor marks this session complete.");
  }

  const clinical = (await store().listPremaritalSessionClinicalForJourney(journeyId)).find(
    (c) => c.sessionKey === sessionKey,
  );
  const resolved = resolveSessionCompletionDate({
    programRow: row,
    clinicalSessionDate: clinical?.sessionDate ?? null,
  });
  const names = await partnerDisplayNames(journey);

  return renderSessionCompletionCertificatePdf({
    partnerAName: names.partnerA,
    partnerBName: names.partnerB,
    sessionOrder: def.order,
    sessionTitle: def.title,
    completionDate: resolved.date,
    completionDateMissing: resolved.missing,
    certificateReference: sessionCertificateReference(journeyId, sessionKey),
  });
}

export async function generateSessionCertificatePdfForCounselor(
  viewer: PublicMember,
  journeyId: string,
  sessionKey: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertClinicalCounselorForJourney(viewer, journey);
  return generateSessionCertificatePdfForViewer(viewer, journeyId, sessionKey);
}

export async function buildFinalCertificateManagementView(
  viewer: PublicMember,
  journeyId: string,
): Promise<MarriageFinalCertificateEligibilityView> {
  await assertSeniorPastor(viewer);
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");

  const blockers = (await computeFinalCertificateBlockers(journey)).filter(
    (b) => !b.startsWith("An active final"),
  );
  const names = await partnerDisplayNames(journey);
  const completion = await suggestProgramCompletionDate(journeyId);
  const history = await store().listFinalCertificatesForJourney(journeyId);
  const active = history.find((c) => c.status === "active") ?? null;
  const audit = await store().listFinalCertificateAuditForJourney(journeyId);

  return {
    eligible: blockers.length === 0 && !active,
    blockers,
    partnerADisplayName: names.partnerA,
    partnerBDisplayName: names.partnerB,
    suggestedCompletionDate: completion.date,
    completionDateMissing: completion.missing,
    activeCertificate: active,
    history,
    audit,
  };
}

export async function issueFinalCertificate(
  viewer: PublicMember,
  journeyId: string,
  input?: { completionDate?: string | null },
) {
  await assertSeniorPastor(viewer);
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");

  const blockers = await computeFinalCertificateBlockers(journey);
  if (blockers.length > 0) throw new Error(blockers[0]);

  const names = await partnerDisplayNames(journey);
  const sp = await seniorPastorSigningInfo();
  const suggested = await suggestProgramCompletionDate(journeyId);
  const completionDate =
    input?.completionDate?.trim() ||
    suggested.date ||
    null;
  const now = new Date().toISOString();
  const id = randomUUID();
  const record = {
    id,
    journeyId,
    certificateNumber: newCertificateNumber(),
    status: "active" as const,
    completionDate,
    issuedAt: now,
    issuedByUserId: viewer.id,
    partnerADisplayName: names.partnerA,
    partnerBDisplayName: names.partnerB,
    seniorPastorName: sp.name,
    seniorPastorTitle: sp.title,
    revokedAt: null,
    revokeReason: null,
    supersededById: null,
    createdAt: now,
  };
  await store().saveFinalCertificate(record);
  await store().saveFinalCertificateAudit({
    id: randomUUID(),
    certificateId: id,
    journeyId,
    action: "issue",
    actorUserId: viewer.id,
    note: null,
    metaJson: JSON.stringify({ certificateNumber: record.certificateNumber }),
    createdAt: now,
  });
  await logMarriageAudit({
    actorUserId: viewer.id,
    action: "final_certificate_issued",
    journeyId,
    meta: { certificateId: id, certificateNumber: record.certificateNumber },
  });
  return record;
}

export async function revokeFinalCertificate(
  viewer: PublicMember,
  certificateId: string,
  reason: string,
) {
  await assertSeniorPastor(viewer);
  const cert = await store().getFinalCertificateById(certificateId);
  if (!cert) throw new Error("Certificate not found.");
  if (cert.status !== "active") throw new Error("Only active certificates can be revoked.");
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Revocation reason is required.");

  const now = new Date().toISOString();
  const updated = {
    ...cert,
    status: "revoked" as const,
    revokedAt: now,
    revokeReason: trimmed,
  };
  await store().saveFinalCertificate(updated);
  await store().saveFinalCertificateAudit({
    id: randomUUID(),
    certificateId: cert.id,
    journeyId: cert.journeyId,
    action: "revoke",
    actorUserId: viewer.id,
    note: trimmed,
    metaJson: null,
    createdAt: now,
  });
  return updated;
}

export async function replaceFinalCertificate(viewer: PublicMember, certificateId: string, reason: string) {
  await assertSeniorPastor(viewer);
  const cert = await store().getFinalCertificateById(certificateId);
  if (!cert) throw new Error("Certificate not found.");
  if (cert.status !== "active") throw new Error("Replace an active certificate only.");

  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Replacement reason is required.");

  const journey = await store().getJourneyById(cert.journeyId);
  if (!journey) throw new Error("Journey not found.");

  const blockers = (await computeFinalCertificateBlockers(journey)).filter(
    (b) => !b.startsWith("An active final"),
  );
  if (blockers.length > 0) throw new Error(blockers[0]);

  const names = await partnerDisplayNames(journey);
  const sp = await seniorPastorSigningInfo();
  const now = new Date().toISOString();
  const id = randomUUID();
  const record = {
    id,
    journeyId: cert.journeyId,
    certificateNumber: newCertificateNumber(),
    status: "active" as const,
    completionDate: cert.completionDate,
    issuedAt: now,
    issuedByUserId: viewer.id,
    partnerADisplayName: names.partnerA,
    partnerBDisplayName: names.partnerB,
    seniorPastorName: sp.name,
    seniorPastorTitle: sp.title,
    revokedAt: null,
    revokeReason: null,
    supersededById: null,
    createdAt: now,
  };
  await store().saveFinalCertificate({
    ...cert,
    status: "superseded",
    revokedAt: now,
    revokeReason: `Superseded: ${trimmed}`,
    supersededById: id,
  });
  await store().saveFinalCertificate(record);
  await store().saveFinalCertificateAudit({
    id: randomUUID(),
    certificateId: id,
    journeyId: cert.journeyId,
    action: "replace",
    actorUserId: viewer.id,
    note: trimmed,
    metaJson: JSON.stringify({ replacedCertificateId: certificateId }),
    createdAt: now,
  });
  return record;
}

export async function generateFinalCertificatePdfForViewer(viewer: PublicMember, journeyId: string) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");

  let isParticipant = false;
  try {
    await assertJourneyParticipantLoose(journey, viewer.id);
    isParticipant = true;
  } catch {
    isParticipant = false;
  }
  const isSp = await isSeniorPastor(viewer);
  if (!isParticipant && !isSp) throw new Error("Not authorized.");

  const active = (await store().listFinalCertificatesForJourney(journeyId)).find(
    (c) => c.status === "active",
  );
  if (!active) throw new Error("Final certificate has not been issued.");

  const setting = await store().getMarriagePrepCertificateSetting();
  await store().saveFinalCertificateAudit({
    id: randomUUID(),
    certificateId: active.id,
    journeyId,
    action: "download",
    actorUserId: viewer.id,
    note: null,
    metaJson: null,
    createdAt: new Date().toISOString(),
  });

  return renderFinalProgramCertificatePdf({
    partnerAName: active.partnerADisplayName,
    partnerBName: active.partnerBDisplayName,
    programTitle: "Marriage Preparation Program",
    completionDate: active.completionDate,
    completionDateMissing: !active.completionDate,
    certificateNumber: active.certificateNumber,
    issuedAt: active.issuedAt,
    seniorPastorName: active.seniorPastorName,
    seniorPastorTitle: active.seniorPastorTitle,
    signatureAssetPath: setting?.seniorPastorSignatureAssetPath ?? null,
  });
}

export async function previewFinalCertificatePdf(viewer: PublicMember, journeyId: string) {
  await assertSeniorPastor(viewer);
  const view = await buildFinalCertificateManagementView(viewer, journeyId);
  const sp = await seniorPastorSigningInfo();
  const setting = await store().getMarriagePrepCertificateSetting();
  await store().saveFinalCertificateAudit({
    id: randomUUID(),
    certificateId: view.activeCertificate?.id ?? "preview",
    journeyId,
    action: "preview",
    actorUserId: viewer.id,
    note: null,
    metaJson: null,
    createdAt: new Date().toISOString(),
  });
  return renderFinalProgramCertificatePdf({
    partnerAName: view.partnerADisplayName,
    partnerBName: view.partnerBDisplayName,
    programTitle: "Marriage Preparation Program",
    completionDate: view.suggestedCompletionDate,
    completionDateMissing: view.completionDateMissing,
    certificateNumber: "PREVIEW-NOT-ISSUED",
    issuedAt: new Date().toISOString(),
    seniorPastorName: sp.name,
    seniorPastorTitle: sp.title,
    signatureAssetPath: setting?.seniorPastorSignatureAssetPath ?? null,
  });
}
