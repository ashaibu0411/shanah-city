import { isBlobConfigured } from "@/lib/use-blob";

const PRODUCTION_REQUIRED = [
  "DATABASE_URL",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "CRON_SECRET",
] as const;

const PRODUCTION_RECOMMENDED = ["ADMIN_BOOTSTRAP_EMAIL", "VAPID_SUBJECT"] as const;

function missingVars(keys: readonly string[]) {
  return keys.filter((key) => !process.env[key]?.trim());
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = missingVars(PRODUCTION_REQUIRED);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}

export function getEnvStatus() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const blobConfigured = isBlobConfigured();
  const pushConfigured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim(),
  );
  const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());
  const adminBootstrapConfigured = Boolean(process.env.ADMIN_BOOTSTRAP_EMAIL?.trim());
  const passwordResetEmailConfigured = Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      (process.env.PASSWORD_RESET_FROM_EMAIL?.trim() ||
        process.env.RESEND_FROM_EMAIL?.trim()),
  );

  const productionMissing =
    process.env.NODE_ENV === "production" ? missingVars(PRODUCTION_REQUIRED) : [];
  const productionRecommendedMissing =
    process.env.NODE_ENV === "production" ? missingVars(PRODUCTION_RECOMMENDED) : [];

  return {
    database: { configured: databaseConfigured },
    blob: { configured: blobConfigured },
    push: { configured: pushConfigured },
    cron: { configured: cronConfigured },
    adminBootstrap: { configured: adminBootstrapConfigured },
    passwordResetEmail: { configured: passwordResetEmailConfigured },
    production:
      process.env.NODE_ENV === "production"
        ? {
            ok: productionMissing.length === 0,
            missing: productionMissing,
            recommendedMissing: productionRecommendedMissing,
          }
        : undefined,
  };
}
