"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { galleryAlbums } from "@/lib/gallery-types";
import { Button, Card } from "@/components/ui";

type AlbumCount = {
  album: string;
  count: number;
};

export function AlbumDeletePanel() {
  const router = useRouter();
  const { loading, permissions } = useAuth();
  const [albums, setAlbums] = useState<AlbumCount[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = !loading && permissions.canUploadGallery;

  useEffect(() => {
    if (loading || !canManage) return;

    async function load() {
      const response = await fetch("/api/gallery/album");
      const data = await response.json();
      if (response.ok) {
        setAlbums(data.albums ?? []);
        if (data.albums?.[0]) {
          setSelectedAlbum(data.albums[0].album);
        }
      }
    }

    load();
  }, [loading, canManage]);

  if (loading || !canManage) {
    return null;
  }

  const selectableAlbums = galleryAlbums.filter((item) => item !== "All");
  const selectedCount =
    albums.find((entry) => entry.album === selectedAlbum)?.count ?? 0;

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (confirmText !== selectedAlbum) {
      setError(`Type the album name "${selectedAlbum}" to confirm.`);
      return;
    }

    if (!window.confirm(`Delete all ${selectedCount} photo(s) in "${selectedAlbum}"?`)) {
      return;
    }

    setBusy(true);
    const response = await fetch("/api/gallery/album", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ album: selectedAlbum }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Could not delete album.");
      return;
    }

    setMessage(
      data.deletedCount > 0
        ? `Deleted ${data.deletedCount} photo(s) from "${selectedAlbum}".`
        : `"${selectedAlbum}" had no photos to delete.`,
    );
    setConfirmText("");

    const refresh = await fetch("/api/gallery/album");
    const refreshData = await refresh.json();
    if (refresh.ok) {
      setAlbums(refreshData.albums ?? []);
    }

    router.refresh();
  }

  return (
    <Card className="mt-8">
      <h2 className="font-display text-xl font-semibold text-night-900">
        Delete an album
      </h2>
      <p className="mt-2 text-sm text-night-600">
        Albums are groups of photos (Worship, Youth, etc.). Deleting an album
        removes every photo in that album from the gallery. Uploaded image files
        are deleted from server storage. This cannot be undone.
      </p>

      <form onSubmit={handleDelete} className="mt-6 space-y-4">
        <div>
          <label htmlFor="delete-album" className="text-sm font-semibold text-night-800">
            Album
          </label>
          <select
            id="delete-album"
            value={selectedAlbum}
            onChange={(event) => {
              setSelectedAlbum(event.target.value);
              setConfirmText("");
              setError(null);
              setMessage(null);
            }}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          >
            {selectableAlbums.map((album) => {
              const count = albums.find((entry) => entry.album === album)?.count ?? 0;
              return (
                <option key={album} value={album}>
                  {album} ({count} photo{count === 1 ? "" : "s"})
                </option>
              );
            })}
          </select>
        </div>

        <p className="text-sm text-night-600">
          {selectedCount > 0
            ? `${selectedCount} photo(s) will be removed from "${selectedAlbum}".`
            : `"${selectedAlbum}" is already empty in the gallery.`}
        </p>

        <div>
          <label htmlFor="confirm-album" className="text-sm font-semibold text-night-800">
            Type <strong>{selectedAlbum}</strong> to confirm
          </label>
          <input
            id="confirm-album"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            placeholder={selectedAlbum}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <Button
          type="submit"
          variant="secondary"
          className={`${busy ? "opacity-70" : ""} bg-red-700 text-white hover:bg-red-800`}
          disabled={busy || selectedCount === 0}
        >
          {busy ? "Deleting..." : `Delete "${selectedAlbum}" album`}
        </Button>
      </form>
    </Card>
  );
}
