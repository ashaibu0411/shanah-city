import { SermonsArchiveSection } from "@/components/sermons/SermonsArchiveSection";
import { PremiumV4Page, PremiumV4PageHeader } from "@/components/design/PremiumV4Page";
import { getChannelSermons } from "@/lib/youtube-sermons-server";

export const dynamic = "force-dynamic";

export default async function SermonsPage() {
  const videos = await getChannelSermons(50);

  return (
    <PremiumV4Page theme="cinematic" className="sc-v4-sermons">
      <PremiumV4PageHeader
        eyebrow="Messages"
        title="Sermons"
        description="Faith begins, grows, and strengthens through hearing the Word of God."
      />

      <SermonsArchiveSection initialVideos={videos} />
    </PremiumV4Page>
  );
}
