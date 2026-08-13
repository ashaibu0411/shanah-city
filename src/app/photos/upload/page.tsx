import Link from "next/link";
import { AlbumDeletePanel } from "@/components/photos/AlbumDeletePanel";
import { PhotoDownloadLog } from "@/components/photos/PhotoDownloadLog";
import { PhotoUploadForm } from "@/components/photos/PhotoUploadForm";
import { PageHeader } from "@/components/ui";

export default function PhotoUploadPage() {
  return (
    <>
      <PageHeader
        eyebrow="Backend team"
        title="Upload Photos"
        description="Restricted to Shanah City backend/media team. Members can browse and download from the public gallery."
      />

      <PhotoUploadForm />

      <AlbumDeletePanel />

      <PhotoDownloadLog />

      <div className="mt-6 rounded-2xl bg-sand-100 p-5 text-sm text-night-600">
        <p className="font-semibold text-night-900">Team access only</p>
        <p className="mt-2">
          Uploads require a signed-in <strong>team</strong> or <strong>leader</strong> account,
          or the backend team PIN (
          <code className="rounded bg-white px-1.5 py-0.5">GALLERY_UPLOAD_PIN</code> in{" "}
          <code className="rounded bg-white px-1.5 py-0.5">.env.local</code>).
        </p>
        <p className="mt-2">
          Default PIN: <code className="rounded bg-white px-1.5 py-0.5">shanahcity</code>
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
