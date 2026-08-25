import { SermonCard } from "@/components/sermons/SermonCard";
import { SermonsGrid } from "@/components/sermons/SermonsGrid";
import { ExternalLink, PageHeader } from "@/components/ui";
import {
  getChannelSermons,
  getShanahCityYouTubeChannelUrl,
} from "@/lib/youtube-sermons-server";

export default async function SermonsPage() {
  const videos = await getChannelSermons();
  const latest = videos[0] ?? null;
  const moreVideos = latest ? videos.slice(1) : videos;

  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Sermons"
        description="Faith begins, grows, and strengthens through hearing the Word of God."
      />

      <SermonCard video={latest} showAllMessagesLink={false} />

      {(moreVideos.length > 0 || videos.length > 0) && (
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sand-600">
                Shanah City on YouTube
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-night-900">
                {moreVideos.length > 0 ? "All messages" : "More on YouTube"}
              </h2>
            </div>
            <ExternalLink
              href={getShanahCityYouTubeChannelUrl()}
              className="text-sm font-semibold text-night-700 hover:text-night-900"
            >
              Open channel →
            </ExternalLink>
          </div>
          {moreVideos.length > 0 ? (
            <SermonsGrid videos={moreVideos} />
          ) : (
            <p className="rounded-2xl bg-sand-100 px-4 py-6 text-sm text-night-600 ring-1 ring-night-900/5">
              Browse the full message archive on{" "}
              <ExternalLink href={getShanahCityYouTubeChannelUrl()} className="font-semibold text-night-800">
                YouTube
              </ExternalLink>
              .
            </p>
          )}
        </section>
      )}

      {videos.length === 0 && (
        <section className="mt-10">
          <SermonsGrid videos={[]} />
        </section>
      )}
    </>
  );
}
