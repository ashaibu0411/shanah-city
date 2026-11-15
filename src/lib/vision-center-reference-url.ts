/** HTTPS-only creative reference links (no credentials, no non-HTTPS schemes). */
export function normalizeVisionReferenceUrl(raw: unknown, max = 1000): { url: string | null; error?: string } {
  const value = typeof raw === "string" ? raw.trim().slice(0, max) : "";
  if (!value) return { url: null };
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return { url: null, error: "Use a valid HTTPS reference link." };
    }
    return { url: parsed.href };
  } catch {
    return { url: null, error: "Use a valid HTTPS reference link." };
  }
}