import { SermonsArchiveSection } from "@/components/sermons/SermonsArchiveSection";
import { PageHeader } from "@/components/ui";
import { getChannelSermons } from "@/lib/youtube-sermons-server";

export const dynamic = "force-dynamic";

export default async function SermonsPage() {
  const videos = await getChannelSermons(50);

  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Sermons"
        description="Faith begins, grows, and strengthens through hearing the Word of God."
      />

      <SermonsArchiveSection initialVideos={videos} />
    </>
  );
}
