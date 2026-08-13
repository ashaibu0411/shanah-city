"use client";

import { useState } from "react";
import type { GivingPlatform } from "@/lib/types";
import { site } from "@/lib/site";
import { ExternalLink } from "@/components/ui";

type GivePlatformCardProps = {
  platform: GivingPlatform;
};

export function GivePlatformCard({ platform }: GivePlatformCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!platform.copyValue) return;
    try {
      await navigator.clipboard.writeText(platform.copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${platform.tone} p-5 text-white shadow-sm`}
    >
      <h3 className="font-display text-xl font-semibold">{platform.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/85">
        {platform.description}
      </p>

      {platform.action === "link" && platform.url ? (
        <ExternalLink
          href={platform.url}
          className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-night-900 transition hover:bg-sand-100"
        >
          Give with {platform.name} ↗
        </ExternalLink>
      ) : null}

      {platform.action === "copy" && platform.copyValue ? (
        <div className="mt-4 rounded-xl bg-white/15 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
            {platform.copyHint ?? "Send to"}
          </p>
          <p className="mt-1 break-all font-mono text-sm font-semibold">
            {platform.copyValue}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-night-900 transition hover:bg-sand-100"
          >
            {copied ? "Copied!" : "Copy for Zelle"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

type GivePlatformGridProps = {
  platforms: GivingPlatform[];
};

export function GivePlatformGrid({ platforms }: GivePlatformGridProps) {
  if (platforms.length === 0) {
    return (
      <div className="rounded-2xl bg-sand-100 p-6 text-sm text-night-600 ring-1 ring-night-900/5">
        Online giving links are being set up. Email{" "}
        <a
          href={`mailto:${site.email}`}
          className="font-semibold text-night-800 hover:underline"
        >
          {site.email}
        </a>{" "}
        or give in person on Friday or Sunday.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {platforms.map((platform) => (
        <GivePlatformCard key={platform.id} platform={platform} />
      ))}
    </div>
  );
}
