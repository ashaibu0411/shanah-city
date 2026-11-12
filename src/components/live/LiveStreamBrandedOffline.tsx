"use client";

import Image from "next/image";
import { brandLogos, liveStream } from "@/lib/site";
import type { StreamPreview } from "@/lib/types";
import { ExternalLink } from "@/components/ui";

type LiveStreamBrandedOfflineProps = {
  preview: StreamPreview;
  compact?: boolean;
};

export function LiveStreamBrandedOffline({ preview, compact }: LiveStreamBrandedOfflineProps) {
  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden bg-[#061329] text-center ${
        compact ? "min-h-[17rem] px-4 py-5" : "min-h-[18rem] px-6 py-8"
      }`}
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(139,77,216,0.30),transparent_60%),linear-gradient(145deg,#061329,#152744_58%,#171333)]"
        aria-hidden
      />
      <div className="relative z-[1] flex max-w-sm flex-col items-center">
        <Image
          src={brandLogos.default}
          alt="Shanah City"
          width={120}
          height={40}
          className="h-7 w-auto drop-shadow-md"
        />
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#e9bc72]">
          Live worship
        </p>
        <p className={`mt-1 font-display font-semibold text-[#f6ebd5] ${compact ? "text-lg" : "text-xl"}`}>
          We&apos;re between broadcasts
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-[#f6ebd5]/80">
          Join us on {preview.platform} for the next service, or turn on notifications below when we
          go live.
        </p>
        <p className="mt-2 text-xs font-medium text-[#e9bc72]/90">{liveStream.scheduledAt}</p>
        <ExternalLink
          href={preview.url}
          className="mt-3 inline-flex rounded-xl border border-[#e9bc72]/45 bg-gradient-to-r from-[#512d83] to-[#1b2d4b] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:border-[#e9bc72]/70"
        >
          Watch on {preview.platform}
        </ExternalLink>
      </div>
    </div>
  );
}
