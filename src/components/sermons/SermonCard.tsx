import Image from "next/image";
import { SermonCardMedia } from "@/components/sermons/SermonCardMedia";
import { latestSermon } from "@/lib/site";
import { formatSermonDate, type SermonVideo } from "@/lib/youtube-sermons-server";
import { Button } from "@/components/ui";

type SermonCardProps = {
  compact?: boolean;
  video?: SermonVideo | null;
  showAllMessagesLink?: boolean;
};

export function SermonCard({
  compact = false,
  video = null,
  showAllMessagesLink = true,
}: SermonCardProps) {
  const title = video?.title ?? latestSermon.title;
  const youtubeUrl = video?.watchUrl ?? latestSermon.youtubeUrl;
  const dateLabel = video ? formatSermonDate(video.publishedAt) : latestSermon.date;
  const thumbnail = video?.thumbnailUrl ?? "/sermons/latest-message.svg";
  const useRemoteThumbnail = Boolean(video?.thumbnailUrl);

  return (
    <div className="overflow-hidden rounded-2xl bg-night-900 text-sand-50 ring-1 ring-night-900/10 md:grid md:grid-cols-2">
      {video ? (
        <SermonCardMedia video={video} title={title} thumbnail={thumbnail} compact={compact} />
      ) : (
        <div className={`relative ${compact ? "aspect-video" : "aspect-video md:aspect-auto md:min-h-[280px]"}`}>
          <Image
            src={thumbnail}
            alt=""
            fill
            unoptimized={!useRemoteThumbnail}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-night-950/20 transition hover:bg-night-950/35"
            aria-label={`Watch ${title} on YouTube`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl text-night-900 shadow-lg">
              ▶
            </span>
          </a>
        </div>
      )}

      <div className={compact ? "p-6" : "p-8 md:p-10"}>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-400">
          {video ? "Latest message" : latestSermon.series}
        </p>
        <h2 className={`mt-3 font-display font-semibold ${compact ? "text-2xl" : "text-3xl"}`}>
          {title}
        </h2>
        {!compact && (
          <p className="mt-4 leading-relaxed text-sand-100">
            {video ? "Watch in the app or listen while you move — pickup continues in the mini player." : latestSermon.description}
          </p>
        )}
        <p className={`${compact ? "mt-3" : "mt-5"} text-sm text-sand-300`}>
          {latestSermon.speaker} · {dateLabel}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-sand-100 px-4 py-2.5 text-sm font-semibold text-night-900 transition hover:bg-sand-200"
          >
            YouTube
          </a>
          {!compact && showAllMessagesLink && (
            <Button href="/sermons" variant="ghost" className="text-sand-100 hover:bg-white/10">
              All messages
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
