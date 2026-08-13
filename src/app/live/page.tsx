import { MediaHub } from "@/components/media/MediaHub";
import { getMediaBrowseLinks, listMediaClips } from "@/lib/media-clips-server";

export default async function LivePage() {
  const [clips, browseLinks] = await Promise.all([
    listMediaClips(),
    Promise.resolve(getMediaBrowseLinks()),
  ]);

  return <MediaHub clips={clips} browseLinks={browseLinks} />;
}
