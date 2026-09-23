import { Suspense } from "react";
import { MediaHub } from "@/components/media/MediaHub";
import { MarkFeedRead } from "@/components/notifications/MarkFeedRead";
import { getChurchSocialImages } from "@/lib/facebook-church-media";
import { getMediaBrowseLinks, listMediaClips } from "@/lib/media-clips-server";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const [clips, browseLinks, churchImages] = await Promise.all([
    listMediaClips(),
    Promise.resolve(getMediaBrowseLinks()),
    getChurchSocialImages(),
  ]);

  return (
    <>
      <MarkFeedRead feed="media" />
      <Suspense fallback={<p className="px-4 py-8 text-sm text-night-500">Loading media…</p>}>
        <MediaHub clips={clips} browseLinks={browseLinks} churchImages={churchImages} />
      </Suspense>
    </>
  );
}
