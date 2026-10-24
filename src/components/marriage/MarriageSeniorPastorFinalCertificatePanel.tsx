"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarriageFinalCertificateEligibilityView } from "@/lib/marriage-certificate-types";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  journeyId: string;
  onError: (message: string) => void;
};

export function MarriageSeniorPastorFinalCertificatePanel({ journeyId, onError }: Props) {
  const [view, setView] = useState<MarriageFinalCertificateEligibilityView | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    onError("");
    const res = await fetch(`/api/marriage/admin/final-certificates?journeyId=${encodeURIComponent(journeyId)}`);
    const data = await readJsonResponse<{ management?: MarriageFinalCertificateEligibilityView; error?: string }>(res);
    if (!res.ok) {
      onError(data.error ?? "Could not load certificate management.");
      setView(null);
    } else {
      setView(data.management ?? null);
    }
    setLoading(false);
  }, [journeyId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-night-500">Loading certificate management…</p>;
  if (!view) return null;

  return (
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <h3 className="text-sm font-semibold">Final certificate (Senior Pastor)</h3>
      <p className="mt-1 text-xs text-night-600 dark:text-sand-400">
        Separate from readiness review. Issuance requires explicit approval; readiness never auto-issues a
        certificate.
      </p>
      {!view.eligible && !view.activeCertificate ? (
        <ul className="mt-2 list-inside list-disc text-xs text-red-800 dark:text-red-200">
          {view.blockers.slice(0, 8).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`/api/marriage/admin/final-certificates?journeyId=${encodeURIComponent(journeyId)}&preview=1`}
          className="rounded-full border border-stone-300 px-3 py-2 text-xs font-bold dark:border-white/20"
          target="_blank"
          rel="noreferrer"
        >
          Preview PDF
        </a>
        {view.eligible ? (
          <button
            type="button"
            className="rounded-full bg-clay-800 px-3 py-2 text-xs font-bold text-white"
            onClick={async () => {
              if (!confirm("Issue official final certificate for this couple?")) return;
              const res = await fetch("/api/marriage/admin/final-certificates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "issue", journeyId }),
              });
              const data = await readJsonResponse<{ error?: string }>(res);
              if (!res.ok) onError(data.error ?? "Issue failed.");
              else await load();
            }}
          >
            Issue certificate
          </button>
        ) : null}
        {view.activeCertificate ? (
          <>
            <a
              href={`/api/marriage/certificates/final?journeyId=${encodeURIComponent(journeyId)}`}
              className="rounded-full border border-stone-300 px-3 py-2 text-xs font-bold dark:border-white/20"
            >
              Download active
            </a>
            <button
              type="button"
              className="rounded-full border border-red-300 px-3 py-2 text-xs font-bold text-red-800"
              onClick={async () => {
                const reason = prompt("Revocation reason (required):");
                if (!reason?.trim()) return;
                const res = await fetch("/api/marriage/admin/final-certificates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "revoke",
                    certificateId: view.activeCertificate!.id,
                    reason,
                  }),
                });
                const data = await readJsonResponse<{ error?: string }>(res);
                if (!res.ok) onError(data.error ?? "Revoke failed.");
                else await load();
              }}
            >
              Revoke
            </button>
          </>
        ) : null}
      </div>
      {view.history.length > 0 ? (
        <p className="mt-3 text-xs text-night-500">
          History: {view.history.length} record(s) · audit {view.audit.length} event(s)
        </p>
      ) : null}
    </div>
  );
}
