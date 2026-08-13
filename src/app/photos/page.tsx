import { PhotoDownloadLog } from "@/components/photos/PhotoDownloadLog";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { PhotoUsePolicyNotice } from "@/components/photos/PhotoUsePolicyNotice";
import { PhotosToolbar } from "@/components/photos/PhotosToolbar";
import { PageHeader } from "@/components/ui";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getGalleryPhotos } from "@/lib/gallery-server";
import { sanitizeGalleryPhotoForViewer } from "@/lib/gallery-utils";
import { cookies } from "next/headers";

export default async function PhotosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const photos = (await getGalleryPhotos()).map((photo) =>
    sanitizeGalleryPhotoForViewer(photo, user),
  );

  return (
    <>
      <PageHeader
        eyebrow="Memories"
        title="Photo Gallery"
        description="Outreach and church photos. Public photos are visible to everyone; private photos require sign-in. Downloads always need a member account."
      />

      <PhotoUsePolicyNotice />

      <PhotosToolbar photoCount={photos.length} />

      <PhotoGallery photos={photos} />

      <p className="mt-8 text-sm text-night-500">
        Media team uploads can choose public or private visibility. Private photos are for
        signed-in members only. Downloads require sign-in, policy agreement, and are logged
        for church safety.
      </p>
    </>
  );
}
