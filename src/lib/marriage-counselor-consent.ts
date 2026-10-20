import { createHash } from "node:crypto";
import type {
  MarriageAnswerChangeGenerationKey,
  MarriageSharingConsentRecord,
} from "@/lib/marriage-counseling-types";
import { isCounselorDisclosureGranted } from "@/lib/marriage-sharing-consent-counselor-state";

export type CounselorDisclosureDenialReason =
  | "consent_not_granted"
  | "counselor_metadata_incomplete"
  | "generation_mismatch"
  | "counselor_not_assigned"
  | "counselor_assignment_mismatch"
  | "viewer_not_assigned_counselor"
  | "answer_not_disclosable"
  | "fingerprint_mismatch"
  | "fingerprint_missing";

const ANSWER_FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/i;

export function isValidCounselorAnswerFingerprint(fingerprint: string | null | undefined): boolean {
  if (!fingerprint?.trim()) return false;
  return ANSWER_FINGERPRINT_PATTERN.test(fingerprint.trim());
}

export type CounselorDisclosureCheckInput = {
  consent: MarriageSharingConsentRecord;
  currentGeneration: number;
  assignedCounselorUserId: string | null;
  viewerCounselorUserId: string;
  currentAnswer: unknown;
};

export type CounselorDisclosureCheckResult =
  | { allowed: true }
  | { allowed: false; reason: CounselorDisclosureDenialReason };

/** Stable JSON serialization for fingerprinting (sorted object keys at one level). */
export function normalizeAnswerForFingerprint(value: unknown): string {
  if (value === "__skip__") return "__skip__";
  if (value === undefined || value === null) return "";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

export function computeAnswerFingerprint(value: unknown): string {
  const normalized = normalizeAnswerForFingerprint(value);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function answerValuesEqual(a: unknown, b: unknown): boolean {
  return normalizeAnswerForFingerprint(a) === normalizeAnswerForFingerprint(b);
}

/** True when a persisted answer change should bump per-question generation. */
export function shouldIncrementGenerationForAnswerChange(
  previousAnswer: unknown,
  nextAnswer: unknown,
): boolean {
  return !answerValuesEqual(previousAnswer, nextAnswer);
}

export function isAnswerDisclosableToCounselor(answer: unknown): boolean {
  if (answer === undefined || answer === null || answer === "__skip__" || answer === "") {
    return false;
  }
  return true;
}

/**
 * Counselor disclosure requires explicit metadata on the consent row.
 * Legacy partner-sharing rows (granted without counselor fields) are not treated as counselor consent.
 */
export function hasCompleteCounselorConsentMetadata(
  consent: MarriageSharingConsentRecord,
): boolean {
  if (!isCounselorDisclosureGranted(consent)) return false;
  if (consent.generationAtGrant == null) return false;
  if (!consent.consentedCounselorUserId?.trim()) return false;
  if (!isValidCounselorAnswerFingerprint(consent.answerFingerprint)) return false;
  return true;
}

export function counselorConsentGenerationValid(
  consent: MarriageSharingConsentRecord,
  currentGeneration: number,
): boolean {
  if (consent.generationAtGrant == null) return false;
  return consent.generationAtGrant === currentGeneration;
}

export function counselorConsentBoundToAssignedCounselor(
  consent: MarriageSharingConsentRecord,
  assignedCounselorUserId: string | null,
): boolean {
  if (!assignedCounselorUserId?.trim()) return false;
  if (!consent.consentedCounselorUserId?.trim()) return false;
  return consent.consentedCounselorUserId === assignedCounselorUserId;
}

export function viewerIsAssignedCounselor(
  viewerCounselorUserId: string,
  assignedCounselorUserId: string | null,
): boolean {
  if (!assignedCounselorUserId?.trim()) return false;
  return viewerCounselorUserId === assignedCounselorUserId;
}

/**
 * Default-deny counselor answer disclosure. Does not expose answer content.
 * Fingerprint mismatch denies even if text matches a prior grant (edit-and-revert).
 */
export function verifyCounselorAnswerDisclosure(
  input: CounselorDisclosureCheckInput,
): CounselorDisclosureCheckResult {
  const { consent, currentGeneration, assignedCounselorUserId, viewerCounselorUserId, currentAnswer } =
    input;

  if (!isCounselorDisclosureGranted(consent)) {
    return { allowed: false, reason: "consent_not_granted" };
  }
  if (!hasCompleteCounselorConsentMetadata(consent)) {
    return { allowed: false, reason: "counselor_metadata_incomplete" };
  }
  if (!viewerIsAssignedCounselor(viewerCounselorUserId, assignedCounselorUserId)) {
    return { allowed: false, reason: "viewer_not_assigned_counselor" };
  }
  if (!counselorConsentBoundToAssignedCounselor(consent, assignedCounselorUserId)) {
    return { allowed: false, reason: "counselor_assignment_mismatch" };
  }
  if (!counselorConsentGenerationValid(consent, currentGeneration)) {
    return { allowed: false, reason: "generation_mismatch" };
  }
  if (!isAnswerDisclosableToCounselor(currentAnswer)) {
    return { allowed: false, reason: "answer_not_disclosable" };
  }
  if (!isValidCounselorAnswerFingerprint(consent.answerFingerprint)) {
    return { allowed: false, reason: "fingerprint_missing" };
  }
  const current = computeAnswerFingerprint(currentAnswer);
  if (current !== consent.answerFingerprint!.trim()) {
    return { allowed: false, reason: "fingerprint_mismatch" };
  }
  return { allowed: true };
}

export function consentKeyMatches(
  consent: MarriageSharingConsentRecord,
  key: MarriageAnswerChangeGenerationKey,
): boolean {
  return (
    consent.journeyId === key.journeyId &&
    consent.moduleId === key.moduleId &&
    consent.questionId === key.questionId &&
    consent.userId === key.userId
  );
}
