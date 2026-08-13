import Link from "next/link";
import { AlbumDeletePanel } from "@/components/photos/AlbumDeletePanel";
import { PhotoDownloadLog } from "@/components/photos/PhotoDownloadLog";
import { PhotoUploadForm } from "@/components/photos/PhotoUploadForm";
import { PageHeader } from "@/components/ui";

export default function PhotoUploadPage() {
  return (
    <>
      <PageHeader
        eyebrow="Media team"
        title="Upload Photos"
        description="Choose public or private visibility, upload many photos at once, and manage the gallery."
      />

      <PhotoUploadForm />

      <AlbumDeletePanel />

      <PhotoDownloadLog />

      <div className="mt-6 rounded-2xl bg-sand-100 p-5 text-sm text-night-600">
        <p className="font-semibold text-night-900">Media team access only</p>
        <p className="mt-2">
          Upload access goes to members with the <strong>media</strong> role or anyone in the{" "}
          <strong>Media Team</strong> group on{" "}
          <Link href="/groups" className="font-semibold text-night-800 hover:underline">
            Groups
          </Link>
          .
        </p>
        <Link
          href="/photos"
          className="mt-3 inline-block font-semibold text-night-800 hover:underline"
        >
          ← Back to member gallery
        </Link>
      </div>
    </>
  );
}
