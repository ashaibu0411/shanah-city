"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { galleryAlbums, type GalleryVisibility } from "@/lib/gallery-types";
import { Button, Card } from "@/components/ui";

type UploadMode = "file" | "link";

type SelectedFile = {
  file: File;
  preview: string;
};

function titleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").trim() || "Untitled photo";
}

function buildPhotoTitle(baseTitle: string, file: File, index: number, total: number) {
  const trimmed = baseTitle.trim();
  if (total === 1) {
    return trimmed || titleFromFilename(file.name);
  }
  if (trimmed) {
    return `${trimmed} (${index + 1})`;
  }
  return titleFromFilename(file.name);
}

export function PhotoUploadForm() {
  const router = useRouter();
  const { user, permissions, loading } = useAuth();
  const [mode, setMode] = useState<UploadMode>("file");
  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("Community");
  const [visibility, setVisibility] = useState<GalleryVisibility>("private");
  const [uploadedBy, setUploadedBy] = useState("Shanah City Team");
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      for (const entry of selectedFiles) {
        URL.revokeObjectURL(entry.preview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearSelectedFiles() {
    setSelectedFiles((current) => {
      for (const entry of current) {
        URL.revokeObjectURL(entry.preview);
      }
      return [];
    });
  }

  function handleFilesChange(fileList: FileList | null) {
    if (!fileList?.length) return;

    const next = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((current) => {
      for (const entry of current) {
        URL.revokeObjectURL(entry.preview);
      }
      return next;
    });
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((current) => {
      const copy = [...current];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  }

  async function uploadSinglePhoto(file: File, photoTitle: string) {
    const formData = new FormData();
    formData.append("title", photoTitle);
    formData.append("album", album);
    formData.append("visibility", visibility);
    formData.append("uploadedBy", uploadedBy);
    formData.append("file", file);

    const response = await fetch("/api/gallery", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Upload failed.");
    }
    return data.photo;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormLoading(true);
    setMessage(null);
    setError(null);
    setUploadProgress(null);

    if (mode === "file") {
      if (selectedFiles.length === 0) {
        setError("Choose one or more photos to upload.");
        setFormLoading(false);
        return;
      }

      if (selectedFiles.length === 1 && !title.trim()) {
        // Auto-title from filename for a single pick is fine.
      }

      try {
        let uploaded = 0;
        for (let index = 0; index < selectedFiles.length; index += 1) {
          const entry = selectedFiles[index];
          setUploadProgress(
            `Uploading ${index + 1} of ${selectedFiles.length}: ${entry.file.name}`,
          );
          const photoTitle = buildPhotoTitle(
            title,
            entry.file,
            index,
            selectedFiles.length,
          );
          await uploadSinglePhoto(entry.file, photoTitle);
          uploaded += 1;
        }

        setMessage(
          uploaded === 1
            ? "Photo uploaded successfully!"
            : `${uploaded} photos uploaded successfully!`,
        );
        setTitle("");
        clearSelectedFiles();
        setUploadProgress(null);
        router.refresh();
      } catch (uploadError) {
        setError(
          uploadError instanceof Error ? uploadError.message : "Upload failed.",
        );
        setUploadProgress(null);
      }

      setFormLoading(false);
      return;
    }

    if (!externalUrl.trim()) {
      setError("Paste a Google Photos, OneDrive, or other cloud share link.");
      setFormLoading(false);
      return;
    }

    if (!title.trim()) {
      setError("Title is required for cloud links.");
      setFormLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("album", album);
    formData.append("visibility", visibility);
    formData.append("uploadedBy", uploadedBy);
    formData.append("externalUrl", externalUrl.trim());

    const response = await fetch("/api/gallery", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setFormLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }

    setMessage("Cloud photo link added to the gallery!");
    setTitle("");
    setExternalUrl("");
    router.refresh();
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-night-600">Checking access...</p>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <h2 className="font-display text-2xl font-semibold text-night-900">Media team upload</h2>
        <p className="mt-2 text-sm text-night-600">
          Sign in with a media team account to upload photos.
        </p>
        <Button href="/sign-in?next=/photos/upload" className="mt-4">
          Sign in
        </Button>
      </Card>
    );
  }

  if (!permissions.canUploadGallery) {
    return (
      <Card>
        <h2 className="font-display text-2xl font-semibold text-night-900">Media team only</h2>
        <p className="mt-2 text-sm text-night-600">
          Gallery uploads are for the media team. Ask a leader to assign the{" "}
          <strong>media</strong> role on your profile, or join the{" "}
          <strong>Media Team</strong> group on{" "}
          <a href="/groups" className="font-semibold text-night-800 hover:underline">
            Groups
          </a>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold text-night-900">Media team upload</h2>
      <p className="mt-2 text-sm text-night-600">
        Signed in as {user.name}. Choose album and visibility, then upload one or many photos.
      </p>

      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
        <p className="text-sm font-semibold text-night-900">Who can view these photos?</p>
        <label htmlFor="visibility" className="mt-3 block text-sm font-semibold text-night-800">
          Visibility
        </label>
        <select
          id="visibility"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as GalleryVisibility)}
          className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        >
          <option value="public">Public — anyone can view</option>
          <option value="private">Private — signed-in members only</option>
        </select>
        <p className="mt-2 text-xs text-night-600">
          You can change this later by opening a photo in the gallery. Downloads always require
          sign-in and the photo use policy.
        </p>
      </div>

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
          Upload files
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
            {mode === "file" && selectedFiles.length > 1
              ? "Title prefix (optional)"
              : "Title"}
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            placeholder={
              mode === "file" && selectedFiles.length > 1
                ? "Outreach day (becomes Outreach day 1, 2, ...)"
                : "Sunday worship, youth night, etc."
            }
            required={mode === "link" || (mode === "file" && selectedFiles.length === 0)}
          />
          {mode === "file" && selectedFiles.length !== 1 && (
            <p className="mt-1 text-xs text-night-500">
              Leave blank to use each file name as the title.
            </p>
          )}
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
            <label htmlFor="uploadedBy" className="text-sm font-semibold text-night-800">
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

        {mode === "file" ? (
          <div>
            <label htmlFor="photo" className="text-sm font-semibold text-night-800">
              Photo files
            </label>
            <input
              id="photo"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => handleFilesChange(event.target.files)}
              className="mt-1 block w-full text-sm text-night-600 file:mr-4 file:rounded-lg file:border-0 file:bg-night-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sand-50"
            />
            <p className="mt-1 text-xs text-night-500">
              You can select many photos at once (JPG, PNG, WEBP, or GIF under 10 MB each).
            </p>
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-night-800">
                  {selectedFiles.length} photo{selectedFiles.length === 1 ? "" : "s"} selected
                </p>
                <ul className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-sand-50 p-3 ring-1 ring-night-900/5">
                  {selectedFiles.map((entry, index) => (
                    <li
                      key={`${entry.file.name}-${index}`}
                      className="flex items-center gap-3 rounded-lg bg-white p-2 ring-1 ring-night-900/5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.preview}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-night-900">
                          {entry.file.name}
                        </p>
                        <p className="text-xs text-night-500">
                          {buildPhotoTitle(title, entry.file, index, selectedFiles.length)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={clearSelectedFiles}
                  className="text-sm font-semibold text-night-700 hover:underline"
                >
                  Clear all
                </button>
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
          </div>
        )}

        {uploadProgress && (
          <p className="rounded-xl bg-sand-100 px-4 py-3 text-sm text-night-700">{uploadProgress}</p>
        )}
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
        )}

        <Button type="submit" className={formLoading ? "opacity-70" : ""}>
          {formLoading
            ? mode === "link"
              ? "Adding link..."
              : selectedFiles.length > 1
                ? `Uploading ${selectedFiles.length} photos...`
                : "Uploading..."
            : mode === "link"
              ? "Add cloud photo"
              : selectedFiles.length > 1
                ? `Upload ${selectedFiles.length} photos`
                : "Upload photo"}
        </Button>
      </form>
    </Card>
  );
}
