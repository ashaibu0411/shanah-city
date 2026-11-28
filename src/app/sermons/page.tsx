import Link from "next/link";
import { SermonsArchiveSection } from "@/components/sermons/SermonsArchiveSection";
import { PremiumV4Page, PremiumV4PageHeader } from "@/components/design/PremiumV4Page";
import { getChannelSermons } from "@/lib/youtube-sermons-server";

export const dynamic = "force-dynamic";

export default async function SermonsPage() {
  const videos = await getChannelSermons(50);

  return (
    <PremiumV4Page theme="cinematic" className="sc-v4-sermons">
      <Link href="/" className="media-v5-back mb-5">← Back to Home</Link>
      <PremiumV4PageHeader
        eyebrow="Watch & Listen"
        title="Latest Sermons"
        description="Faith begins, grows, and strengthens through hearing the Word of God."
      />

      <SermonsArchiveSection initialVideos={videos} />
    </PremiumV4Page>
  );
}
