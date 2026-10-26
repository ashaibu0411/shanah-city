"use client";

import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import {
  counselorAssignmentWorkflowStatusLabel,
} from "@/lib/marriage-counselor-assignment-ui";
import { readJsonResponse } from "@/lib/read-json-response";

type AssignmentStatus = {
  journeyId: string;
  activeCounselorUserId: string | null;
  pendingRequest: { id: string; status: string } | null;
  approvedAwaitingExecution: {
    id: string;
    requestedCounselorUserId: string | null;
    requestedCounselorDisplayName?: string | null;
    restorationRequired: boolean;
    restorationRequiredFrom: string[];
    acknowledgmentsReceived: string[];
  } | null;
  participantRevocations: Array<{ userId: string }>;
  permissions: {
    canSubmitRequest: boolean;
    canApprove: boolean;
    canAcknowledgeRestoration: boolean;
  };
};

type Props = {
  journeyId: string;
  viewerUserId: string;
};

export function MarriageCounselorAssignmentParticipantPanel({
  journeyId,
  viewerUserId,
}: Props) {
  const [status, setStatus] = useState<AssignmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await fetch(
      `/api/marriage/counselor/assignment-requests?journeyId=${encodeURIComponent(journeyId)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse<AssignmentStatus & { error?: string }>(res);
    if (!res.ok) {
      setError(data.error ?? "Could not load counselor access settings.");
      setStatus(null);
    } else {
      setStatus(data);
    }
    setLoading(false);
  }, [journeyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAssignment(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/marriage/counselor/assignment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readJsonResponse<{ error?: string; executed?: boolean }>(res);
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setMessage(
        body.action === "acknowledge_restoration"
          ? data.executed
            ? "Counselor access restored."
            : "Thank you — waiting for your spouse to acknowledge."
          : "Done.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeCounselor() {
    if (
      !window.confirm(
        "Revoke counselor access immediately? Your counselor will lose access to this journey. This does not require pastor approval.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/marriage/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_counselor", journeyId }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Revocation failed.");
      setMessage("Counselor access revoked.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revocation failed.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className={`${marriagePremium.card} mt-4`} aria-busy="true">
        <p className={marriagePremium.cardMuted}>Loading counselor access…</p>
      </section>
    );
  }

  if (!status) {
    return error ? (
      <section className={`${marriagePremium.card} mt-4`} role="alert">
        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
      </section>
    ) : null;
  }

  const approved = status.approvedAwaitingExecution;
  const proposedName =
    approved?.requestedCounselorDisplayName?.trim() ||
    approved?.requestedCounselorUserId?.trim() ||
    "Counselor";
  const userRevoked = status.participantRevocations.some((r) => r.userId === viewerUserId);
  const spouseRevoked = status.participantRevocations.some((r) => r.userId !== viewerUserId);
  const canRecordRevocation =
    !userRevoked &&
    Boolean(status.activeCounselorUserId || approved || spouseRevoked);
  const mustAck =
    approved?.restorationRequired &&
    approved.restorationRequiredFrom.includes(viewerUserId) &&
    !approved.acknowledgmentsReceived.includes(viewerUserId);

  const workflowLabel = counselorAssignmentWorkflowStatusLabel({
    pendingRequest: status.pendingRequest
      ? { status: status.pendingRequest.status as "pending" }
      : null,
    approvedAwaitingExecution: approved,
    activeCounselorUserId: status.activeCounselorUserId,
  });

  return (
    <section
      id="counselor-assignment"
      className={`${marriagePremium.card} mt-4`}
      aria-labelledby="counselor-access-heading"
    >
      <h2 id="counselor-access-heading" className="text-base font-semibold">
        Counselor access
      </h2>
      <p className={`${marriagePremium.cardMuted} mt-1`}>{workflowLabel}</p>

      {approved && approved.restorationRequired && (
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            Restoration requires your acknowledgment
          </p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/85">
            Proposed counselor: <strong>{proposedName}</strong>. Acknowledging does{" "}
            <strong>not</strong> share assessment answers — you control disclosure separately in
            each module.
          </p>
          {mustAck && (
            <button
              type="button"
              disabled={busy}
              className={`${marriagePremium.primaryCta} mt-3`}
              onClick={() =>
                void postAssignment({
                  action: "acknowledge_restoration",
                  requestId: approved.id,
                })
              }
            >
              Authorize counselor restoration
            </button>
          )}
          {!mustAck && userRevoked && approved.acknowledgmentsReceived.includes(viewerUserId) && (
            <p className="mt-2 text-xs text-amber-900/80">You have acknowledged this request.</p>
          )}
        </div>
      )}

      {canRecordRevocation && (
        <button
          type="button"
          disabled={busy}
          className={`${marriagePremium.secondaryCta} mt-4 border-red-200 text-red-900 dark:border-red-900/40 dark:text-red-200`}
          onClick={() => void revokeCounselor()}
        >
          Revoke counselor access
        </button>
      )}
      {canRecordRevocation && spouseRevoked && !status.activeCounselorUserId && (
        <p className={`${marriagePremium.cardMuted} mt-2 text-xs`}>
          Your spouse already revoked access. Record your revocation so both of you can authorize
          restoration later.
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-800 dark:text-red-300" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-300" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
