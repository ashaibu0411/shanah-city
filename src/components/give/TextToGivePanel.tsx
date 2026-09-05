"use client";

import { useState } from "react";
import type { TextToGiveConfig } from "@/lib/giving-text";
import { smsGiveUrl } from "@/lib/giving-text";

type TextToGivePanelProps = {
  config: TextToGiveConfig;
};

export function TextToGivePanel({ config }: TextToGivePanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="mb-8 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 p-6 text-white shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
        Text to give
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold">Give by text message</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90">
        Text a keyword to{" "}
        <span className="font-semibold text-white">{config.displayNumber}</span>
        {config.provider ? ` through ${config.provider}` : ""}. You&apos;ll get a secure link
        back to complete your gift on your phone.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {config.keywords.map((entry) => (
          <div key={entry.keyword} className="rounded-xl bg-white/15 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {entry.label}
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wide">{entry.keyword}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={smsGiveUrl(config.number, entry.keyword)}
                className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-night-900 transition hover:bg-sand-100"
              >
                Text {entry.keyword}
              </a>
              <button
                type="button"
                onClick={() => void copyValue(entry.keyword, entry.keyword)}
                className="inline-flex rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
              >
                {copied === entry.keyword ? "Copied!" : "Copy keyword"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-white/10 p-4 text-sm text-white/90">
        <p>
          Send to{" "}
          <button
            type="button"
            onClick={() => void copyValue("number", config.number)}
            className="font-semibold text-white underline decoration-white/40 underline-offset-2"
          >
            {config.displayNumber}
          </button>
          {copied === "number" ? " · Copied!" : null}
        </p>
        {config.note ? <p className="mt-2 text-white/80">{config.note}</p> : null}
        <p className="mt-2 text-xs text-white/70">
          Standard message and data rates from your carrier may apply.
        </p>
      </div>
    </section>
  );
}
