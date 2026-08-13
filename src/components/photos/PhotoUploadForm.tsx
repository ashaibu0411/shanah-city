"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { galleryAlbums } from "@/lib/gallery-types";
import { Button, Card } from "@/components/ui";

type UploadMode = "file" | "link";

export function PhotoUploadForm() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("file");
  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("Community");
  const [uploadedBy, setUploadedBy] = useState("Shanah City Team");
  const [pin, setPin] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (mode === "file" && !file) {
      setError("Choose a photo to upload.");
      setLoading(false);
      return;
    }

    if (mode === "link" && !externalUrl.trim()) {
      setError("Paste a Google Photos, OneDrive, or other cloud share link.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("album", album);
    formData.append("uploadedBy", uploadedBy);
    formData.append("pin", pin);

    if (mode === "file" && file) {
      formData.append("file", file);
    } else {
      formData.append("externalUrl", externalUrl.trim());
    }

    const response = await fetch("/api/gallery", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(
        data.error ??
          (response.status === 403
            ? "Backend team access required."
            : "Upload failed."),
      );
      return;
    }

    setMessage(
      mode === "link"
        ? "Cloud photo link added to the gallery!"
        : "Photo uploaded successfully!",
    );
    setTitle("");
    setFile(null);
    setExternalUrl("");
    setPreview(null);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">
        Backend team upload
      </h2>
      <p className="mt-2 text-sm text-night-600">
        Upload a file from your device, or paste a share link from Google Photos,
        OneDrive, Dropbox, iCloud, or Box.
      </p>

      <div className="mt-4 flex gap-2 rounded-xl bg-sand-100 p-1">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === "file"
              ? "bg-white text-night-900 shadow-sm"
              : "text-night-600 hover:text-night-900"
          }`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === "link"
              ? "bg-white text-night-900 shadow-sm"
              : "text-night-600 hover:text-night-900"
          }`}
        >
          Paste cloud link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="title" className="text-sm font-semibold text-night-800">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            placeholder="Sunday worship, youth night, etc."
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="album" className="text-sm font-semibold text-night-800">
              Album
            </label>
            <select
              id="album"
              value={album}
              onChange={(event) => setAlbum(event.target.value)}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              {galleryAlbums
                .filter((item) => item !== "All")
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="uploadedBy"
              className="text-sm font-semibold text-night-800"
            >
              Uploaded by
            </label>
            <input
              id="uploadedBy"
              value={uploadedBy}
              onChange={(event) => setUploadedBy(event.target.value)}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pin" className="text-sm font-semibold text-night-800">
            Backend team PIN
          </label>
          <input
            id="pin"
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            placeholder="Team upload PIN"
            required
          />
        </div>

        {mode === "file" ? (
          <div>
            <label htmlFor="photo" className="text-sm font-semibold text-night-800">
              Photo file
            </label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
              className="mt-1 block w-full text-sm text-night-600 file:mr-4 file:rounded-lg file:border-0 file:bg-night-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sand-50"
            />
            {preview && (
              <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-night-900/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="max-h-64 w-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="externalUrl" className="text-sm font-semibold text-night-800">
              Cloud share link
            </label>
            <input
              id="externalUrl"
              type="url"
              value={externalUrl}
              onChange={(event) => setExternalUrl(event.target.value)}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
              placeholder="https://photos.google.com/... or OneDrive / Dropbox link"
            />
            <p className="mt-2 text-xs leading-relaxed text-night-500">
              Use a public share link. In Google Photos: Share → Create link. In
              OneDrive: Share → Copy link. Some cloud links may preview as a link
              card instead of an image if the provider blocks embedding.
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <Button type="submit" className={loading ? "opacity-70" : ""}>
          {loading
            ? mode === "link"
              ? "Adding link..."
              : "Uploading..."
            : mode === "link"
              ? "Add cloud photo"
              : "Upload photo"}
        </Button>
      </form>
    </Card>
  );
}
