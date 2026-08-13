import { PhotoDownloadLog } from "@/components/photos/PhotoDownloadLog";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { PhotoUsePolicyNotice } from "@/components/photos/PhotoUsePolicyNotice";
import { PhotosToolbar } from "@/components/photos/PhotosToolbar";
import { PageHeader } from "@/components/ui";
import { getGalleryPhotos } from "@/lib/gallery-server";

export default async function PhotosPage() {
  const photos = await getGalleryPhotos();

  return (
    <>
      <PageHeader
        eyebrow="Memories"
        title="Photo Gallery"
        description="Member gallery for church use. Sign in to view and download. Reposting without approval is not allowed."
      />

      <PhotoUsePolicyNotice />

      <PhotosToolbar photoCount={photos.length} />

      <PhotoGallery photos={photos} />

      <p className="mt-8 text-sm text-night-500">
        The upload button appears for media team members (media role or Media Team group).
        Downloads require sign-in, policy agreement, and are logged for church safety.
      </p>
    </>
  );
}
