/**
 * Stage 2 Marriage Hub — disabled in production until validated.
 * Set MARriage_HUB_STAGE2_ENABLED=1 (server) and NEXT_PUBLIC_MARRIAGE_STAGE2=1 (client nav).
 */
export function isMarriageStage2Enabled(): boolean {
  const server = process.env.MARRIAGE_HUB_STAGE2_ENABLED?.trim();
  const client = process.env.NEXT_PUBLIC_MARRIAGE_STAGE2?.trim();
  return server === "1" || server === "true" || client === "1" || client === "true";
}

export function isMarriageStage2ClientEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_MARRIAGE_STAGE2 === "1" ||
    process.env.NEXT_PUBLIC_MARRIAGE_STAGE2 === "true"
  );
}

const INTIMACY_MODULE_ID = "s2-mod-06-intimacy";

/** Pastoral content review — intimacy module stays hidden/disabled until approved. */
export function isMarriageStage2IntimacyApproved(): boolean {
  const v = process.env.MARRIAGE_HUB_STAGE2_INTIMACY_APPROVED?.trim();
  return v === "1" || v === "true";
}

export function isMarriageStage2IntimacyModule(moduleId: string): boolean {
  return moduleId === INTIMACY_MODULE_ID;
}

export function marriageStage2IntimacyModuleAccessible(moduleId: string): boolean {
  if (!isMarriageStage2IntimacyModule(moduleId)) return true;
  return isMarriageStage2IntimacyApproved();
}
