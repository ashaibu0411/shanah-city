"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui";

type PhotosToolbarProps = {
  photoCount: number;
};

export function PhotosToolbar({ photoCount }: PhotosToolbarProps) {
  const { user, permissions, loading } = useAuth();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-night-600">
        {photoCount} photo{photoCount === 1 ? "" : "s"} available
        {user
          ? " · choose public or private when uploading"
          : " · public photos visible; private photos need sign-in"}
      </p>
      {!loading && permissions.canUploadGallery ? (
        <Button href="/photos/upload" variant="secondary">
          Upload photos
        </Button>
      ) : null}
      {!loading && !user ? (
        <Button href="/sign-in?next=/photos" variant="secondary">
          Sign in
        </Button>
      ) : null}
    </div>
  );
}
