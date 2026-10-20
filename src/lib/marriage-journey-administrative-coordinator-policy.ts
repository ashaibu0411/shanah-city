/** Shared allow-list for assignment admins (Option A coordinator scope). */
export function assignmentAdminIdsFromEnv(): Set<string> {
  const raw = process.env.MARRIAGE_COUNSELOR_ASSIGNMENT_ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
