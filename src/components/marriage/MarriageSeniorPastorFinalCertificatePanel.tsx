"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  MarriageFinalCertificateEligibilityView,
  MarriagePremaritalFinalCertificateRecord,
} from "@/lib/marriage-certificate-types";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  journeyId: string;
  onError: (message: string) => void;
};

function statusLabel(status: MarriagePremaritalFinalCertificateRecord["status"]) {
  return status.replace(/_/g, " ");
}

export function MarriageSeniorPastorFinalCertificatePanel({ journeyId, onError }: Props) {
  const [view, setView] = useState<MarriageFinalCertificateEligibilityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [replaceReason, setReplaceReason] = useState("");
  const [selectedReplaceId, setSelectedReplaceId] = useState<string>("");

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
      const active = data.management?.activeCertificate;
      setSelectedReplaceId(active?.id ?? "");
    }
    setLoading(false);
  }, [journeyId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-night-500">Loading certificate management…</p>;
  if (!view) return null;

  const replaceCandidates = view.history.filter((c) => c.status === "active");

  return (
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Final certificate (Senior Pastor)</h3>
        <Link href="/marriage/admin/certificate-settings" className="text-xs font-bold underline">
          Signature settings
        </Link>
      </div>
      <p className="mt-1 text-xs text-night-600 dark:text-sand-400">
        Separate from readiness review. Issuance requires explicit approval; readiness never auto-issues a certificate.
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

      {replaceCandidates.length > 0 ? (
        <div className="mt-4 rounded-lg border border-stone-200 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20">
          <p className="text-xs font-bold uppercase text-night-600">Replace active certificate</p>
          <p className="mt-1 text-xs text-night-500">
            Creates a new certificate number and marks the prior record superseded. History is preserved.
          </p>
          <select
            className="marriage-c3m-input mt-2"
            value={selectedReplaceId}
            onChange={(e) => setSelectedReplaceId(e.target.value)}
          >
            {replaceCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.certificateNumber} ({statusLabel(c.status)})
              </option>
            ))}
          </select>
          <textarea
            className="marriage-c3m-textarea mt-2"
            placeholder="Replacement reason (required)"
            value={replaceReason}
            onChange={(e) => setReplaceReason(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-stone-400 px-3 py-2 text-xs font-bold"
              disabled={!replaceReason.trim() || !selectedReplaceId}
              onClick={async () => {
                if (!confirm("Issue replacement certificate and supersede the selected record?")) return;
                const res = await fetch("/api/marriage/admin/final-certificates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "replace",
                    certificateId: selectedReplaceId,
                    reason: replaceReason.trim(),
                  }),
                });
                const data = await readJsonResponse<{ error?: string; certificate?: { certificateNumber?: string } }>(
                  res,
                );
                if (!res.ok) onError(data.error ?? "Replace failed.");
                else {
                  setReplaceReason("");
                  await load();
                }
              }}
            >
              Confirm replacement
            </button>
            <a
              href={`/api/marriage/admin/final-certificates?journeyId=${encodeURIComponent(journeyId)}&preview=1`}
              className="rounded-full border border-stone-300 px-3 py-2 text-xs font-bold"
              target="_blank"
              rel="noreferrer"
            >
              Preview replacement layout
            </a>
          </div>
        </div>
      ) : null}

      {view.history.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase text-night-600">Issuance history</p>
          <ul className="mt-2 space-y-1 text-xs">
            {view.history.map((c) => (
              <li key={c.id} className="rounded-md bg-white/50 px-2 py-1 dark:bg-white/5">
                <span className="font-semibold">{c.certificateNumber}</span> · {statusLabel(c.status)} · issued{" "}
                {new Date(c.issuedAt).toLocaleDateString()}
                {c.revokeReason ? ` · ${c.revokeReason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {view.audit.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase text-night-600">Audit trail</p>
          <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-xs text-night-500">
            {view.audit.map((a) => (
              <li key={a.id}>
                {a.action} · {new Date(a.createdAt).toLocaleString()}
                {a.note ? ` — ${a.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
