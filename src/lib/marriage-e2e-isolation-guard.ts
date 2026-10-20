import path from "path";

/** Directory segment for Playwright-isolated JSON data (must not be used on deploy). */
export const MARRIAGE_E2E_ISOLATED_DIR = ".e2e-isolated";

export type MarriageE2eIsolationEvaluation =
  | { status: "inactive" }
  | { status: "verified" }
  | { status: "misconfigured"; reason: string };

const LOCAL_BIND_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

function normalizeForCompare(filePath: string): string {
  return path.resolve(filePath).replace(/\\/g, "/").toLowerCase();
}

function isUnderE2eIsolated(resolvedPath: string): boolean {
  const normalized = normalizeForCompare(resolvedPath);
  return normalized.includes(`/${MARRIAGE_E2E_ISOLATED_DIR}/`);
}

function expectedE2eDataDir(cwd = process.cwd()): string {
  return path.join(cwd, MARRIAGE_E2E_ISOLATED_DIR, "data");
}

function marriageE2eExplicitlyDisablesDatabase(): boolean {
  if (process.env.SHANAH_E2E_DISABLE_DATABASE !== "1") return false;
  if (process.env.SHANAH_MARRIAGE_E2E_LOCAL !== "1") return false;
  const bindHost = process.env.MARRIAGE_E2E_BIND_HOST?.trim().toLowerCase();
  if (!bindHost || !LOCAL_BIND_HOSTS.has(bindHost)) return false;
  const authDir = process.env.AUTH_DATA_DIR?.trim();
  if (!authDir || !isUnderE2eIsolated(path.resolve(authDir))) return false;
  return true;
}

function hasPostgresConnectionConfigured(): boolean {
  if (marriageE2eExplicitlyDisablesDatabase()) return false;
  for (const key of ["DATABASE_URL", "DIRECT_URL", "DIRECT_DATABASE_URL"] as const) {
    if (process.env[key]?.trim()) return true;
  }
  return false;
}

function isDeployedRuntime(): string | null {
  if (process.env.NODE_ENV === "production") {
    return "NODE_ENV is production.";
  }
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") {
    return "VERCEL is set (deployed runtime).";
  }
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview") {
    return `VERCEL_ENV is ${vercelEnv}.`;
  }
  if (process.env.AWS_LAMBDA_FUNCTION_NAME?.trim()) {
    return "AWS Lambda runtime detected.";
  }
  if (process.env.RAILWAY_ENVIRONMENT?.trim()) {
    return "Railway deployed environment detected.";
  }
  if (process.env.FLY_APP_NAME?.trim()) {
    return "Fly.io deployed environment detected.";
  }
  if (process.env.NETLIFY === "true") {
    return "Netlify deployed environment detected.";
  }
  if (process.env.CF_PAGES === "1") {
    return "Cloudflare Pages deployed environment detected.";
  }
  return null;
}

function localE2eHostReason(): string | null {
  if (process.env.SHANAH_MARRIAGE_E2E_LOCAL !== "1") {
    return "SHANAH_MARRIAGE_E2E_LOCAL must be 1 for verified local Playwright E2E.";
  }
  const bindHost = process.env.MARRIAGE_E2E_BIND_HOST?.trim().toLowerCase();
  if (!bindHost || !LOCAL_BIND_HOSTS.has(bindHost)) {
    return "MARRIAGE_E2E_BIND_HOST must be 127.0.0.1 or localhost.";
  }
  const port = process.env.PORT?.trim() || process.env.E2E_PORT?.trim();
  if (port !== "3099") {
    return "E2E server must use port 3099 (PORT or E2E_PORT).";
  }
  return null;
}

function isolatedDataPathReason(): string | null {
  const authDir = process.env.AUTH_DATA_DIR?.trim();
  if (!authDir) {
    return "AUTH_DATA_DIR must point to .e2e-isolated/data.";
  }
  const resolvedAuth = path.resolve(authDir);
  const expectedAuth = path.resolve(expectedE2eDataDir());
  if (normalizeForCompare(resolvedAuth) !== normalizeForCompare(expectedAuth)) {
    return "AUTH_DATA_DIR must resolve to <project>/.e2e-isolated/data.";
  }
  if (!isUnderE2eIsolated(resolvedAuth)) {
    return "AUTH_DATA_DIR is outside the isolated E2E directory.";
  }

  const marriageFile = process.env.MARRIAGE_COUNSELING_DATA_FILE?.trim();
  if (!marriageFile) {
    return "MARRIAGE_COUNSELING_DATA_FILE must be set for verified E2E.";
  }
  if (!isUnderE2eIsolated(path.resolve(marriageFile))) {
    return "MARRIAGE_COUNSELING_DATA_FILE must live under .e2e-isolated/.";
  }

  const curriculumFile = process.env.MARRIAGE_CURRICULUM_DATA_FILE?.trim();
  if (curriculumFile && !isUnderE2eIsolated(path.resolve(curriculumFile))) {
    return "MARRIAGE_CURRICULUM_DATA_FILE must live under .e2e-isolated/ when set.";
  }

  const groupsDir = process.env.GROUPS_DATA_DIR?.trim();
  if (groupsDir && !isUnderE2eIsolated(path.resolve(groupsDir))) {
    return "GROUPS_DATA_DIR must live under .e2e-isolated/ when set.";
  }

  return null;
}

/**
 * Fail-closed evaluation of marriage Playwright E2E isolation.
 * Bypass privileges (auth rate limit, JSON store) apply only when status is `verified`.
 */
export function evaluateMarriageE2eIsolationGuard(): MarriageE2eIsolationEvaluation {
  if (process.env.MARRIAGE_E2E_ISOLATED !== "1") {
    return { status: "inactive" };
  }

  const deployed = isDeployedRuntime();
  if (deployed) return { status: "misconfigured", reason: deployed };

  if (hasPostgresConnectionConfigured()) {
    return {
      status: "misconfigured",
      reason: "PostgreSQL connection env vars must not be set with MARRIAGE_E2E_ISOLATED.",
    };
  }

  const hostReason = localE2eHostReason();
  if (hostReason) return { status: "misconfigured", reason: hostReason };

  const pathReason = isolatedDataPathReason();
  if (pathReason) return { status: "misconfigured", reason: pathReason };

  return { status: "verified" };
}

export function isVerifiedMarriageE2eIsolation(): boolean {
  return evaluateMarriageE2eIsolationGuard().status === "verified";
}

export function shouldBypassAuthRateLimitForMarriageE2e(): boolean {
  return isVerifiedMarriageE2eIsolation();
}

let misconfigurationLogged = false;

/** Log once and throw when E2E flag is set but verification failed (never silently use JSON on deploy). */
export function assertMarriageE2eIsolationSafeForDatabaseRouting(): void {
  const evaluation = evaluateMarriageE2eIsolationGuard();
  if (evaluation.status !== "misconfigured") return;

  const message = `[marriage-e2e] Misconfiguration: ${evaluation.reason} Remove MARRIAGE_E2E_ISOLATED or fix local E2E paths.`;
  if (!misconfigurationLogged) {
    misconfigurationLogged = true;
    console.error(message);
  }

  if (hasPostgresConnectionConfigured()) {
    return;
  }

  throw new Error(message);
}
