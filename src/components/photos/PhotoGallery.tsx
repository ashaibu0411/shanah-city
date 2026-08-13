"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import type { GalleryPhoto } from "@/lib/gallery-types";
import { galleryAlbums } from "@/lib/gallery-types";
import {
  getExternalPhotoUrl,
  getPhotoDownloadUrl,
  getPhotoSourceLabel,
  isExternalPhotoUrl,
  isPrivatePhotoUrl,
} from "@/lib/gallery-utils";
import { photoUsePolicy } from "@/lib/photo-use-policy";
import { Button } from "@/components/ui";

type PhotoGalleryProps = {
  photos: GalleryPhoto[];
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const { user, loading } = useAuth();
  const [album, setAlbum] = useState<string>("All");
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const filtered = useMemo(
    () =>
      album === "All"
        ? photos
        : photos.filter((photo) => photo.album === album),
    [album, photos],
  );

  function photoSrc(photo: GalleryPhoto) {
    if (isExternalPhotoUrl(photo.url)) {
      return user ? getExternalPhotoUrl(photo.url) : "";
    }
    if (user) {
      return `/api/gallery/download?id=${photo.id}&inline=1`;
    }
    if (isPrivatePhotoUrl(photo.url)) {
      return "";
    }
    return photo.url;
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
          You can browse photos here.{" "}
          <Link href="/sign-in?next=/photos" className="font-semibold text-night-900 hover:underline">
            Sign in
          </Link>{" "}
          to download them.
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
                setAgreedToPolicy(false);
                setSelected(photo);
              }}
              className="group overflow-hidden rounded-2xl bg-white text-left ring-1 ring-night-900/5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sand-200">
                {!user && (isPrivatePhotoUrl(photo.url) || isExternalPhotoUrl(photo.url)) ? (
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
              {!user && (isPrivatePhotoUrl(selected.url) || isExternalPhotoUrl(selected.url)) ? (
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
                  {selected.album} · {selected.uploadedBy}
                </p>
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
              <div className="flex gap-2">
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
