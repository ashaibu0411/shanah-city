export function useDatabase() {
  if (process.env.MARRIAGE_E2E_ISOLATED === "1") return false;
  return Boolean(process.env.DATABASE_URL?.trim());
}
