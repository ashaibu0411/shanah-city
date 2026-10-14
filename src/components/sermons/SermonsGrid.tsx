import { ExternalLink } from "@/components/ui";
import { SermonGridCard } from "@/components/sermons/SermonGridCard";
import { getShanahCityYouTubeChannelUrl, type SermonVideo } from "@/lib/youtube-sermons-shared";

type SermonsGridProps = {
  videos: SermonVideo[];
};

export function SermonsGrid({ videos }: SermonsGridProps) {
  if (videos.length === 0) {
    return (
      <p className="rounded-2xl bg-sand-100 px-4 py-6 text-sm text-night-600 ring-1 ring-night-900/5">
        Messages could not be loaded right now. Watch on{" "}
        <ExternalLink href={getShanahCityYouTubeChannelUrl()} className="font-semibold text-night-800">
          YouTube
        </ExternalLink>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <SermonGridCard key={video.id} video={video} />
      ))}
    </div>
  );
}
