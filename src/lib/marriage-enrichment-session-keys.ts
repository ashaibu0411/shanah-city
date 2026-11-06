/** Stage 2 enrichment reviews use self-paced records but never touch premarital session counts. */
export const STAGE2_ENRICHMENT_SESSION_PREFIX = "stage2:";

export function stage2EnrichmentSessionKey(moduleId: string) {
  return `${STAGE2_ENRICHMENT_SESSION_PREFIX}${moduleId}`;
}

export function isStage2EnrichmentSessionKey(sessionKey: string) {
  return sessionKey.startsWith(STAGE2_ENRICHMENT_SESSION_PREFIX);
}

export function moduleIdFromEnrichmentSessionKey(sessionKey: string) {
  if (!isStage2EnrichmentSessionKey(sessionKey)) return null;
  return sessionKey.slice(STAGE2_ENRICHMENT_SESSION_PREFIX.length);
}
