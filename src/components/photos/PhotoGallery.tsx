"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import type { GalleryPhoto, GalleryVisibility } from "@/lib/gallery-types";
import {
  galleryAlbums,
  getGalleryVisibility,
  isMembersOnlyGalleryPhoto,
} from "@/lib/gallery-types";
import {
  getPhotoDisplayUrl,
  getPhotoDownloadUrl,
  getPhotoSourceLabel,
  isExternalPhotoUrl,
} from "@/lib/gallery-utils";
import { photoUsePolicy } from "@/lib/photo-use-policy";
import { Button } from "@/components/ui";

type PhotoGalleryProps = {
  photos: GalleryPhoto[];
};

export function PhotoGallery({ photos: initialPhotos }: PhotoGalleryProps) {
  const { user, loading, permissions } = useAuth();
  const [photos, setPhotos] = useState(initialPhotos);
  const [album, setAlbum] = useState<string>("All");
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const filtered = useMemo(
    () =>
      album === "All"
        ? photos
        : photos.filter((photo) => photo.album === album),
    [album, photos],
  );

  function photoSrc(photo: GalleryPhoto) {
    return getPhotoDisplayUrl(photo, user);
  }

  async function downloadPhoto(photo: GalleryPhoto) {
    setDownloadError(null);

    if (!user) {
      setDownloadError("Sign in to download photos.");
      return;
    }

    if (!agreedToPolicy) {
      setDownloadError("Accept the photo use policy to download.");
      return;
    }

    try {
      if (isExternalPhotoUrl(photo.url)) {
        window.open(getPhotoDownloadUrl(photo), "_blank", "noopener,noreferrer");
        return;
      }

      const response = await fetch(getPhotoDownloadUrl(photo));
      if (response.status === 401) {
        setDownloadError("Sign in to download photos.");
        return;
      }
      if (!response.ok) {
        setDownloadError("Download failed. Try again.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `${photo.title}.jpg`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Download failed. Try again.");
    }
  }

  function isLockedForViewer(photo: GalleryPhoto) {
    return isMembersOnlyGalleryPhoto(photo) && !user;
  }

  function replacePhoto(updated: GalleryPhoto) {
    setPhotos((current) =>
      current.map((photo) => (photo.id === updated.id ? updated : photo)),
    );
    setSelected((current) => (current?.id === updated.id ? updated : current));
  }

  async function updateVisibility(nextVisibility: GalleryVisibility) {
    if (!selected || !permissions.canUploadGallery) return;

    setVisibilitySaving(true);
    setVisibilityError(null);

    const response = await fetch("/api/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, visibility: nextVisibility }),
    });
    const data = await response.json();
    setVisibilitySaving(false);

    if (!response.ok) {
      setVisibilityError(data.error ?? "Could not update visibility.");
      return;
    }

    replacePhoto(data.photo as GalleryPhoto);
  }

  async function deletePhoto(photo: GalleryPhoto) {
    if (!permissions.canUploadGallery) return;

    const confirmed = window.confirm(
      `Delete "${photo.title}" from the gallery? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleteSaving(true);
    setDeleteError(null);

    const response = await fetch("/api/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id }),
    });
    const data = await response.json();
    setDeleteSaving(false);

    if (!response.ok) {
      setDeleteError(data.error ?? "Could not delete photo.");
      return;
    }

    setPhotos((current) => current.filter((entry) => entry.id !== photo.id));
    setSelected(null);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {galleryAlbums.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAlbum(item)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              album === item
                ? "bg-night-900 text-sand-50"
                : "bg-white text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {!loading && !user && (
        <div className="mb-6 rounded-2xl bg-sand-100 p-4 text-sm text-night-700 ring-1 ring-night-900/5">
          Public photos are visible to everyone. Photos marked private require{" "}
          <Link href="/sign-in?next=/photos" className="font-semibold text-night-900 hover:underline">
            sign in
          </Link>
          . Downloads always require a member account and policy agreement.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-night-900/5">
          <p className="text-night-600">No photos in this album yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => {
                setDownloadError(null);
                setVisibilityError(null);
                setDeleteError(null);
                setAgreedToPolicy(false);
                setSelected(photo);
              }}
              className="group overflow-hidden rounded-2xl bg-white text-left ring-1 ring-night-900/5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sand-200">
                {!user && isLockedForViewer(photo) ? (
                  <div className="flex h-full flex-col items-center justify-center bg-night-900 p-4 text-center text-sm text-white">
                    <p className="font-semibold">Members only</p>
                    <p className="mt-1 text-white/70">Sign in to view this photo</p>
                  </div>
                ) : photoSrc(photo) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoSrc(photo)}
                    alt={photo.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center bg-sand-200 p-4 text-center text-sm text-night-700">
                    <p className="font-semibold">{getPhotoSourceLabel(photo)}</p>
                    <p className="mt-1 text-night-500">Preview unavailable</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-sand-600">
                  {photo.album}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-night-900">
                  {photo.title}
                </h3>
                <p className="mt-1 text-xs text-night-500">
                  {photo.uploadedBy ?? "Shanah City"}
                  {isMembersOnlyGalleryPhoto(photo) ? " · Members only" : " · Public"}
                  {isExternalPhotoUrl(photo.url)
                    ? ` · ${getPhotoSourceLabel(photo)}`
                    : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-night-950/90 p-4"
          onClick={() => setSelected(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelected(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex min-h-[240px] items-center justify-center bg-night-900">
              {isLockedForViewer(selected) ? (
                <div className="p-8 text-center text-white">
                  <p className="font-display text-xl font-semibold">Sign in to view</p>
                  <p className="mt-2 text-sm text-white/70">
                    This photo is available to signed-in members only.
                  </p>
                  <Button href="/sign-in?next=/photos" className="mt-4" variant="secondary">
                    Sign in
                  </Button>
                </div>
              ) : photoSrc(selected) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoSrc(selected)}
                  alt={selected.title}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <div className="p-8 text-center text-white">
                  <p className="font-display text-xl font-semibold">
                    {getPhotoSourceLabel(selected)}
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    This cloud photo opens on the provider site.
                  </p>
                  {user && (
                    <Button
                      href={getPhotoDownloadUrl(selected)}
                      className="mt-4"
                      variant="secondary"
                    >
                      Open photo ↗
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h3 className="font-display text-2xl font-semibold text-night-900">
                  {selected.title}
                </h3>
                <p className="mt-1 text-sm text-night-500">
                  {selected.album} · {selected.uploadedBy} ·{" "}
                  {isMembersOnlyGalleryPhoto(selected) ? "Members only" : "Public"}
                </p>
                {permissions.canUploadGallery && (
                  <div className="mt-3 max-w-md rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                    <label
                      htmlFor="photo-visibility"
                      className="text-sm font-semibold text-night-800"
                    >
                      Who can view
                    </label>
                    <select
                      id="photo-visibility"
                      value={getGalleryVisibility(selected)}
                      onChange={(event) =>
                        updateVisibility(event.target.value as GalleryVisibility)
                      }
                      disabled={visibilitySaving || deleteSaving}
                      className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:opacity-60"
                    >
                      <option value="public">Public — anyone can view</option>
                      <option value="private">Private — signed-in members only</option>
                    </select>
                    {visibilityError && (
                      <p className="mt-2 text-sm text-red-600">{visibilityError}</p>
                    )}
                  </div>
                )}
                {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
                {downloadError && (
                  <p className="mt-2 text-sm text-red-600">{downloadError}</p>
                )}
                {user && (
                  <label className="mt-4 flex items-start gap-3 text-sm text-night-700">
                    <input
                      type="checkbox"
                      checked={agreedToPolicy}
                      onChange={(event) => {
                        setAgreedToPolicy(event.target.checked);
                        setDownloadError(null);
                      }}
                      className="mt-1"
                    />
                    <span>{photoUsePolicy.agreementLabel}</span>
                  </label>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {permissions.canUploadGallery && (
                  <Button
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50"
                    onClick={() => deletePhoto(selected)}
                    disabled={deleteSaving || visibilitySaving}
                  >
                    {deleteSaving ? "Deleting..." : "Delete photo"}
                  </Button>
                )}
                {user ? (
                  <Button
                    variant="secondary"
                    onClick={() => downloadPhoto(selected)}
                    disabled={!agreedToPolicy}
                  >
                    {isExternalPhotoUrl(selected.url) ? "Open photo" : "Download"}
                  </Button>
                ) : (
                  <Button href="/sign-in?next=/photos" variant="secondary">
                    Sign in to download
                  </Button>
                )}
                <Button onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
