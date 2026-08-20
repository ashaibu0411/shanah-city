import { MediaHub } from "@/components/media/MediaHub";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { getMediaBrowseLinks, listMediaClips } from "@/lib/media-clips-server";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const [clips, browseLinks] = await Promise.all([
    listMediaClips(),
    Promise.resolve(getMediaBrowseLinks()),
  ]);

  return (
    <>
      <MarkFeedRead feed="media" />
      <MediaHub clips={clips} browseLinks={browseLinks} />
    </>
  );
}
