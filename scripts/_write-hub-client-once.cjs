const fs = require("fs");
const hubClient = `import type { MarriageHubSummary } from "@/lib/marriage-counseling-types";
import { readJsonResponse } from "@/lib/read-json-response";

export type MarriageHubClientLoadResult =
  | { ok: true; data: MarriageHubSummary }
  | { ok: false; kind: "auth"; message: string }
  | { ok: false; kind: "forbidden"; message: string }
  | { ok: false; kind: "rate_limited"; message: string }
  | { ok: false; kind: "server"; message: string }
  | { ok: false; kind: "network"; message: string };

export type MarriageHubPageGate =
  | "loading"
  | "guest"
  | "sign_in_required"
  | "error"
  | "ready";

/** Client hub gate — avoids infinite spinners when auth or hub fetch fails. */
export function resolveMarriageHubPageGate(input: {
  authLoading: boolean;
  hubLoading: boolean;
  userId: string | null | undefined;
  hubLoadError: string | null;
}): MarriageHubPageGate {
  if (input.authLoading || input.hubLoading) return "loading";
  if (!input.userId) return "guest";
  if (input.hubLoadError === "__sign_in_required__") return "sign_in_required";
  if (input.hubLoadError) return "error";
  return "ready";
}

const DEFAULT_HUB_TIMEOUT_MS = 45_000;

export async function fetchMarriageHubSummaryClient(
  timeoutMs = DEFAULT_HUB_TIMEOUT_MS,
): Promise<MarriageHubClientLoadResult> {
  try {
    const res = await fetch("/api/marriage/hub", {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    let data: MarriageHubSummary & { error?: string };
    try {
      data = await readJsonResponse<MarriageHubSummary & { error?: string }>(res);
    } catch (parseError) {
      return {
        ok: false,
        kind: "server",
        message:
          parseError instanceof Error
            ? parseError.message
            : "Unexpected server response. Try again in a moment.",
      };
    }
    if (res.status === 401) {
      return { ok: false, kind: "auth", message: data.error ?? "Sign in required." };
    }
    if (res.status === 403) {
      return { ok: false, kind: "forbidden", message: data.error ?? "Access denied." };
    }
    if (res.status === 429) {
      return {
        ok: false,
        kind: "rate_limited",
        message: data.error ?? "Too many requests. Try again shortly.",
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        kind: "server",
        message: data.error ?? \`Could not load Marriage Prep (\${res.status}).\`,
      };
    }
    return { ok: true, data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        ok: false,
        kind: "network",
        message: "Marriage Prep took too long to load. Check your connection and try again.",
      };
    }
    if (error instanceof Error) {
      return { ok: false, kind: "network", message: error.message };
    }
    return { ok: false, kind: "network", message: "Could not reach Marriage Prep. Try again." };
  }
}

export function marriageHubLoadErrorMessage(
  result: Extract<MarriageHubClientLoadResult, { ok: false }>,
): string {
  if (result.kind === "auth") return "__sign_in_required__";
  return result.message;
}
`;
fs.writeFileSync("src/lib/marriage-hub-client.ts", hubClient, "utf8");
