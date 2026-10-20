import {
  assertMarriageE2eIsolationSafeForDatabaseRouting,
  isVerifiedMarriageE2eIsolation,
} from "@/lib/marriage-e2e-isolation-guard";

export function useDatabase() {
  assertMarriageE2eIsolationSafeForDatabaseRouting();

  if (isVerifiedMarriageE2eIsolation()) {
    return false;
  }

  return Boolean(process.env.DATABASE_URL?.trim());
}
