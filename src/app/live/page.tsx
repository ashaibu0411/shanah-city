import { MediaHub } from "@/components/media/MediaHub";
import { getMediaBrowseLinks, getMediaClips } from "@/lib/media-clips-server";

export default async function LivePage() {
  const [clips, browseLinks] = await Promise.all([
    getMediaClips(),
    Promise.resolve(getMediaBrowseLinks()),
  ]);

  return <MediaHub clips={clips} browseLinks={browseLinks} />;
}
