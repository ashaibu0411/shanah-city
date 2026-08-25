import Image from "next/image";
import { ExternalLink } from "@/components/ui";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-server";

type SermonsGridProps = {
  videos: SermonVideo[];
};

export function SermonsGrid({ videos }: SermonsGridProps) {
  if (videos.length === 0) {
    return (
      <p className="rounded-2xl bg-sand-100 px-4 py-6 text-sm text-night-600 ring-1 ring-night-900/5">
        Messages could not be loaded right now. Watch on{" "}
        <ExternalLink href="https://www.youtube.com/@ShanahCity" className="font-semibold text-night-800">
          YouTube
        </ExternalLink>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <ExternalLink
          key={video.id}
          href={video.watchUrl}
          className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-night-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative aspect-video overflow-hidden bg-night-900">
            <Image
              src={video.thumbnailUrl}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-night-950/20 transition group-hover:bg-night-950/35">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-lg text-night-900 shadow-lg">
                ▶
              </span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sand-600">
              {formatSermonDate(video.publishedAt)}
            </p>
            <h3 className="mt-2 line-clamp-3 font-display text-lg font-semibold leading-snug text-night-900">
              {video.title}
            </h3>
            <p className="mt-3 text-sm font-semibold text-night-600 group-hover:text-night-900">
              Watch on YouTube →
            </p>
          </div>
        </ExternalLink>
      ))}
    </div>
  );
}
