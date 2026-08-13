"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui";

type PhotosToolbarProps = {
  photoCount: number;
};

function canUpload(user: { role?: string } | null) {
  return user?.role === "team" || user?.role === "leader";
}

export function PhotosToolbar({ photoCount }: PhotosToolbarProps) {
  const { user, loading } = useAuth();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-night-600">
        {photoCount} photo{photoCount === 1 ? "" : "s"} available
        {user
          ? " · view in app; download requires agreement"
          : " · sign in to view member photos"}
      </p>
      {!loading && canUpload(user) ? (
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
