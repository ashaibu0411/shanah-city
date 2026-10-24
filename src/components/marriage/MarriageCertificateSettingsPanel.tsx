"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarriagePrepCertificateSettingAuditRecord } from "@/lib/marriage-certificate-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

type SettingsView = {
  hasSignature: boolean;
  updatedAt: string | null;
  updatedByUserId: string | null;
  audit: MarriagePrepCertificateSettingAuditRecord[];
  storage?: { writable: boolean; configurationHint: string | null };
};

export function MarriageCertificateSettingsPanel() {
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/marriage/admin/certificate-settings");
    const data = await readJsonResponse<{ settings?: SettingsView; error?: string }>(res);
    if (!res.ok) setError(data.error ?? "Could not load settings.");
    else setSettings(data.settings ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file: File) {
    setBusy(true);
    const form = new FormData();
    form.set("action", "upload_signature");
    form.set("file", file);
    const res = await fetch("/api/marriage/admin/certificate-settings", { method: "POST", body: form });
    const data = await readJsonResponse<{ error?: string }>(res);
    setBusy(false);
    if (!res.ok) setError(data.error ?? "Upload failed.");
    else await load();
  }

  return (
    <div className={marriagePremium.inset}>
      <h1 className={marriagePremium.heroTitle}>Certificate settings</h1>
      <p className={`${marriagePremium.cardMuted} mt-2 text-sm`}>
        Upload an authorized signature image for final Marriage Prep certificates. Only explicitly approved images
        are used — never auto-generated signatures. If none is configured, certificates show the Senior Pastor printed
        name and title only.
      </p>
      {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
      {settings?.storage && !settings.storage.writable ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          Signature upload is disabled until private storage is configured. {settings.storage.configurationHint}
        </p>
      ) : null}

      <div className={`${marriagePremium.card} mt-6`}>
        <p className={marriagePremium.sectionLabel}>Senior Pastor signature</p>
        {settings?.hasSignature ? (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/marriage/admin/certificate-settings/signature"
              alt="Configured signature preview"
              className="max-h-24 rounded border border-stone-200 bg-white p-2 dark:border-white/10"
            />
            <p className="mt-2 text-xs text-night-500">
              Last updated {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : "—"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm">No signature configured.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <label className={`${marriagePremium.primaryCta} cursor-pointer`}>
            {busy ? "Uploading…" : "Upload signature image"}
            <input
              type="file"
              accept="image/png"
              className="hidden"
              disabled={busy || settings?.storage?.writable === false}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </label>
          {settings?.hasSignature ? (
            <button
              type="button"
              className={marriagePremium.secondaryCta}
              disabled={busy}
              onClick={async () => {
                if (!confirm("Remove the configured signature? Final certificates will use printed name only.")) return;
                setBusy(true);
                const res = await fetch("/api/marriage/admin/certificate-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "remove_signature", note: "Removed from settings UI" }),
                });
                const data = await readJsonResponse<{ error?: string }>(res);
                setBusy(false);
                if (!res.ok) setError(data.error ?? "Remove failed.");
                else await load();
              }}
            >
              Remove signature
            </button>
          ) : null}
        </div>
        <p className={`${marriagePremium.cardMuted} mt-3 text-xs`}>
          To preview how the signature appears on a certificate, open Preview PDF from a couple&apos;s Senior Pastor
          certificate panel after configuring the image here.
        </p>
      </div>

      {(settings?.audit.length ?? 0) > 0 ? (
        <div className={`${marriagePremium.card} mt-4`}>
          <p className={marriagePremium.sectionLabel}>Configuration audit</p>
          <ul className="mt-2 space-y-2 text-xs">
            {settings!.audit.map((a) => (
              <li key={a.id} className="rounded-lg bg-stone-50 px-3 py-2 dark:bg-white/5">
                <span className="font-semibold capitalize">{a.action.replace(/_/g, " ")}</span>
                {" · "}
                {new Date(a.createdAt).toLocaleString()}
                {a.note ? ` — ${a.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
