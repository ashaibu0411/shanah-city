"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageCounselorConsentModuleStatus } from "@/lib/marriage-counselor-consent-participant";
import { readJsonResponse } from "@/lib/read-json-response";

export function MarriageCounselorAnswerConsent({
  journeyId,
  moduleId,
  questionId,
  submitted,
  answerDisclosable,
}: {
  journeyId: string;
  moduleId: string;
  questionId: string;
  submitted: boolean;
  answerDisclosable: boolean;
}) {
  const [status, setStatus] = useState<MarriageCounselorConsentModuleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/marriage/assessment/${encodeURIComponent(moduleId)}/counselor-consent?journeyId=${encodeURIComponent(journeyId)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<MarriageCounselorConsentModuleStatus & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Unable to load sharing status.");
      setStatus(null);
    } else {
      setStatus(data);
    }
    setLoading(false);
  }, [journeyId, moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const assignmentRef = useRef<string>("");
  useEffect(() => {
    const key = `${status?.assignedCounselorUserId ?? ""}:${status?.counselorAccessRevoked ?? false}`;
    if (status && assignmentRef.current && assignmentRef.current !== key) {
      void load();
    }
    assignmentRef.current = key;
  }, [status?.assignedCounselorUserId, status?.counselorAccessRevoked, status, load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  const assignmentActive =
    Boolean(status?.counselorAssigned) && !status?.counselorAccessRevoked;

  const item = status?.items.find((i) => i.questionId === questionId);
  const counselorName = status?.assignedCounselorName ?? "your assigned counselor";
  const shared = assignmentActive && item?.state === "shared_with_counselor";
  const withdrawn =
    !assignmentActive || item?.state === "withdrawn";
  const showPrivate = !shared && (!withdrawn || !assignmentActive);

  async function mutate(action: "grant" | "revoke") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/marriage/assessment/${encodeURIComponent(moduleId)}/counselor-consent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, journeyId, questionId }),
        },
      );
      const data = await readJsonResponse<{ error?: string; status?: MarriageCounselorConsentModuleStatus }>(
        res,
      );
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      if (data.status) setStatus(data.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  let statusLabel = "Private — not shared";
  if (shared) statusLabel = `Shared with ${counselorName}`;
  else if (withdrawn && assignmentActive) statusLabel = "Permission withdrawn";
  else if (!assignmentActive && showPrivate) statusLabel = "Private — not shared";

  const canToggleGrant =
    submitted && answerDisclosable && status?.counselorAssigned && !status.counselorAccessRevoked;

  return (
    <div
      className="mt-3 rounded-xl border border-clay-200/80 bg-clay-50/50 p-3 text-sm dark:border-clay-800 dark:bg-white/5"
      data-testid={`counselor-consent-${questionId}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-clay-800">Counselor sharing</p>
      <p className="mt-1 text-night-700 dark:text-night-200" aria-live="polite">
        {loading ? "Loading sharing status…" : statusLabel}
      </p>
      <p className={`${marriagePremium.cardMuted} mt-2 text-xs`}>
        Your counselor can see this answer only when you give permission. You can withdraw permission at
        any time. If you change your answer, you will need to give permission again.
      </p>
      {!loading && !status?.counselorAssigned && (
        <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">
          A counselor must be assigned before you can share this answer.
        </p>
      )}
      {!loading && status?.counselorAccessRevoked && (
        <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">
          Counselor access is paused for this journey. Previous sharing permissions no longer apply.
        </p>
      )}
      {!submitted && (
        <p className="mt-2 text-xs text-night-600">Submit this module to enable counselor sharing.</p>
      )}
      {submitted && !answerDisclosable && (
        <p className="mt-2 text-xs text-night-600">Add an answer before sharing with your counselor.</p>
      )}
      {canToggleGrant && item && (
        <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            data-testid={`counselor-consent-toggle-${questionId}`}
            disabled={busy || loading}
            checked={shared}
            onChange={(e) => void mutate(e.target.checked ? "grant" : "revoke")}
            className="h-5 w-5 rounded border-stone-400"
            aria-label="Share this answer with our assigned counselor"
          />
          <span>Share this answer with our assigned counselor</span>
        </label>
      )}
      {error && <p className="mt-2 text-xs text-red-800">{error}</p>}
    </div>
  );
}
