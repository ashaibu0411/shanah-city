import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";

export const COUNSELOR_JOURNEY_ACCESS_PATCH_FORBIDDEN =
  "Counselor assignment changes must use applyCounselorJourneyAccessChange.";

export type CounselorJourneyAccessPatch = {
  counselorUserId?: string | null;
  counselorAccessRevokedAt?: string | null;
};

function normalizeCounselorId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeRevokedAt(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** True when counselor assignment or access-revocation state changes (requires consent invalidation). */
export function counselorJourneyAccessChangeRequiresInvalidation(
  journey: Pick<
    MarriageCounselingJourneyRecord,
    "counselorUserId" | "counselorAccessRevokedAt"
  >,
  patch: CounselorJourneyAccessPatch,
): boolean {
  if (
    patch.counselorUserId !== undefined &&
    normalizeCounselorId(patch.counselorUserId) !== normalizeCounselorId(journey.counselorUserId)
  ) {
    return true;
  }
  if (
    patch.counselorAccessRevokedAt !== undefined &&
    normalizeRevokedAt(patch.counselorAccessRevokedAt) !==
      normalizeRevokedAt(journey.counselorAccessRevokedAt)
  ) {
    return true;
  }
  return false;
}

export function assertNoCounselorFieldsInGenericJourneyPatch(
  patch: Partial<CounselorJourneyAccessPatch>,
): void {
  if (patch.counselorUserId !== undefined || patch.counselorAccessRevokedAt !== undefined) {
    throw new Error(COUNSELOR_JOURNEY_ACCESS_PATCH_FORBIDDEN);
  }
}
