import type { MemberProfile } from "@/lib/auth-types";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { VERIFIED_STAGING_VERCEL_PROJECT_ID } from "@/lib/vercel-staging-project-id";

/** @internal Unit tests only — never call from app code. */
let verifiedStagingProjectIdOverrideForTests: string | null = null;

/** @internal */
export function setVerifiedStagingProjectIdForTests(projectId: string | null): void {
  verifiedStagingProjectIdOverrideForTests = projectId;
}

function resolvedVerifiedStagingVercelProjectId(): string {
  const fromSource = verifiedStagingProjectIdOverrideForTests ?? VERIFIED_STAGING_VERCEL_PROJECT_ID;
  return fromSource.trim();
}

function isLocalExplicitDiagnosticOptIn(): boolean {
  if (process.env.PHASE3M_ASSIGNMENT_DISPLAY_DIAG !== "1") return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

function isStagingVercelDeployment(): boolean {
  const verifiedId = resolvedVerifiedStagingVercelProjectId();
  if (!verifiedId) return false;
  if (process.env.VERCEL_GIT_COMMIT_REF?.trim() !== "staging") return false;
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!projectId) return false;
  return projectId === verifiedId;
}

/** Staging Vercel project + staging branch only; never live production project. */
export function isPhase3mAssignmentDisplayDiagnosticActive(): boolean {
  if (isLocalExplicitDiagnosticOptIn()) return true;
  return isStagingVercelDeployment();
}

export type Phase3mUserLookupDiagPayload = {
  tag: "phase3m-user-lookup-diag";
  storageBackend: "db" | "json";
  lookupSucceeded: boolean;
  nameNonEmpty: boolean;
  displayNameNonEmpty: boolean;
  publicLabelNonEmpty: boolean;
};

export function buildPhase3mUserLookupDiagPayload(
  storageBackend: "db" | "json",
  user: MemberProfile | null,
): Phase3mUserLookupDiagPayload {
  return {
    tag: "phase3m-user-lookup-diag",
    storageBackend,
    lookupSucceeded: user !== null,
    nameNonEmpty: Boolean(user?.name?.trim()),
    displayNameNonEmpty: Boolean(user?.displayName?.trim()),
    publicLabelNonEmpty: Boolean(user && getPublicDisplayName(user).trim()),
  };
}

/** Server logs only (e.g. Vercel function logs). No PII, ids, tokens, or URLs. */
export function logPhase3mUserLookupDiagnostic(
  storageBackend: "db" | "json",
  user: MemberProfile | null,
): void {
  if (!isPhase3mAssignmentDisplayDiagnosticActive()) return;
  console.info(JSON.stringify(buildPhase3mUserLookupDiagPayload(storageBackend, user)));
}
