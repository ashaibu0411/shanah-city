import { isBlobConfigured } from "@/lib/use-blob";

const PRODUCTION_REQUIRED = [
  "DATABASE_URL",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "LEADER_PIN",
  "GALLERY_UPLOAD_PIN",
] as const;

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

  const productionMissing =
    process.env.NODE_ENV === "production" ? missingVars(PRODUCTION_REQUIRED) : [];

  return {
    database: { configured: databaseConfigured },
    blob: { configured: blobConfigured },
    push: { configured: pushConfigured },
    production:
      process.env.NODE_ENV === "production"
        ? { ok: productionMissing.length === 0, missing: productionMissing }
        : undefined,
  };
}
