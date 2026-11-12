"use client";

import Image from "next/image";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
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
      className={`relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden bg-[#061329] text-center ${
        compact ? "px-4 py-6" : "px-6 py-8"
      }`}
    >
      <StreamPreviewImage
        preview={preview}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#061329]/92 via-[#512d83]/55 to-[#061329]/95"
        aria-hidden
      />
      <div className="relative z-[1] flex max-w-sm flex-col items-center">
        <Image
          src={brandLogos.default}
          alt="Shanah City"
          width={120}
          height={40}
          className="h-9 w-auto drop-shadow-md"
        />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#e9bc72]">
          Live worship
        </p>
        <p className={`mt-2 font-display font-semibold text-[#f6ebd5] ${compact ? "text-lg" : "text-xl"}`}>
          We&apos;re between broadcasts
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#f6ebd5]/80">
          Join us on {preview.platform} for the next service, or turn on notifications below when we
          go live.
        </p>
        <p className="mt-3 text-xs font-medium text-[#e9bc72]/90">{liveStream.scheduledAt}</p>
        <ExternalLink
          href={preview.url}
          className="mt-5 inline-flex rounded-xl border border-[#e9bc72]/45 bg-gradient-to-r from-[#512d83] to-[#1b2d4b] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:border-[#e9bc72]/70"
        >
          Watch on {preview.platform}
        </ExternalLink>
      </div>
    </div>
  );
}
