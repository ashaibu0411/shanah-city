import Link from "next/link";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { liveStream, site } from "@/lib/site";
import { streamPreviews } from "@/lib/streams";
import { Badge, ExternalLink } from "@/components/ui";

const serviceSummary = site.serviceTimes
  .map((service) => `${service.day.replace(" Evenings", "").replace(" Mornings", "")} ${service.time.split(" – ")[0]}`)
  .join(" · ");

export function LiveBanner() {
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  if (anyLive) {
    return (
      <Link
        href="/live"
        className="group mb-6 block overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-night-900 p-5 text-white shadow-lg transition hover:scale-[1.01]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="live">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Live now
            </Badge>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              {liveStream.title}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {liveStream.viewerCount.toLocaleString()} watching · Tap to join
            </p>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl transition group-hover:bg-white/25">
            ▶
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-night-950 text-white shadow-lg ring-1 ring-night-900/10">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-sand-300">
          Next service
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold">{serviceSummary}</h2>
        <p className="mt-1 text-sm text-white/70">
          Aurora, USA · Accra, Ghana · Online
        </p>
      </div>

      <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {streamPreviews.map((preview) => (
          <ExternalLink
            key={preview.id}
            href={preview.url}
            className="group relative block aspect-video overflow-hidden bg-night-900"
          >
            <StreamPreviewImage
              preview={preview}
              alt={`${preview.platform} · ${preview.label}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/30 transition group-hover:bg-night-950/45">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg text-night-900 shadow">
                {preview.platform === "Instagram" ? "↗" : "▶"}
              </span>
              <p className="mt-2 text-xs font-semibold">{preview.label}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/80">
                {preview.platform === "Instagram"
                  ? `Follow @${preview.handle ?? "shanahcity"}`
                  : `Watch on ${preview.platform}`}
              </p>
            </div>
          </ExternalLink>
        ))}
      </div>

      <div className="px-5 py-3 text-center">
        <Link href="/live" className="text-sm font-semibold text-sand-200 hover:text-white">
          Open full live player →
        </Link>
      </div>
    </div>
  );
}
