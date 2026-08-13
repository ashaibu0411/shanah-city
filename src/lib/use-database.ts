export function useDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
