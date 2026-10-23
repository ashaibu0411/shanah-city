"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import type { MarriageDeletionRequestQueueRow } from "@/lib/marriage-deletion-request-admin";
import { formatMarriageSessionScheduledAt } from "@/lib/marriage-session-scheduling";
import { readJsonResponse } from "@/lib/read-json-response";

export function MarriageDeletionRequestsAdmin() {
  const [rows, setRows] = useState<MarriageDeletionRequestQueueRow[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/marriage/admin/deletion-requests", { cache: "no-store" });
    const data = await readJsonResponse<{ rows?: MarriageDeletionRequestQueueRow[]; error?: string }>(
      res,
    );
    if (!res.ok) {
      setError(data.error ?? "Access denied.");
      setRows([]);
    } else {
      setRows(data.rows ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(journeyId: string, action: "archive" | "dismiss") {
    const message =
      action === "archive"
        ? "Archive this journey? Assessment and counseling records remain stored for church record-keeping; the couple will no longer see an active journey."
        : "Dismiss this deletion request? All journey data stays active and the couple can continue the program.";
    if (!window.confirm(message)) return;

    setBusyId(journeyId);
    setError("");
    const res = await fetch("/api/marriage/admin/deletion-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, journeyId }),
    });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusyId("");
    if (!res.ok) {
      setError(data.error ?? "Action failed.");
      return;
    }
    await load();
  }

  return (
    <div>
      <Link href="/marriage" className="text-sm font-semibold text-clay-700">
        ← Marriage hub
      </Link>
      <h1 className="mt-2 font-display text-xl font-semibold">Journey deletion requests</h1>
      <p className={`${marriagePremium.cardMuted} mt-2`}>
        Participant requests for pastoral review. Archival hides the active journey but does not permanently
        erase assessments, consent history, or counselor notes.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className={`${marriagePremium.cardMuted} mt-6`}>Loading requests…</p>
      ) : rows.length === 0 ? (
        <p className={`${marriagePremium.card} mt-6 text-sm`}>No pending deletion requests.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li key={row.journeyId} className={marriagePremium.card}>
              <p className="font-semibold">{row.coupleNames}</p>
              <p className="mt-1 text-xs text-night-500 dark:text-sand-400">
                Journey <span className="font-mono">{row.journeyId}</span>
              </p>
              <p className="mt-2 text-sm capitalize">
                Program · {row.programType.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-sm">
                Requested ·{" "}
                {formatMarriageSessionScheduledAt(row.deletionRequestedAt)}
              </p>
              <p className="mt-1 text-sm capitalize">Status · {row.status}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === row.journeyId}
                  className={marriagePremium.primaryCta}
                  onClick={() => void runAction(row.journeyId, "archive")}
                >
                  Archive journey
                </button>
                <button
                  type="button"
                  disabled={busyId === row.journeyId}
                  className={marriagePremium.secondaryCta}
                  onClick={() => void runAction(row.journeyId, "dismiss")}
                >
                  Dismiss request
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
