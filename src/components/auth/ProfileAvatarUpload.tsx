"use client";

import { useMemo, useRef, useState } from "react";
import type { PublicMember } from "@/lib/auth-types";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMemberAvatarApiUrl } from "@/lib/avatar-utils";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { isNativeAppPlatform } from "@/lib/native-app";
import { pickProfilePhotoFile } from "@/lib/native-media-picker";
import {
  fetchProfileAvatarUploadConfig,
  uploadProfileAvatarClient,
} from "@/lib/profile-avatar-client";
import { normalizeAvatarFile, isAllowedAvatarImage } from "@/lib/avatar-image";
import { Button } from "@/components/ui";

type ProfileAvatarUploadProps = {
  user: PublicMember;
  onUpdated: (user: PublicMember) => void;
};

export function ProfileAvatarUpload({ user, onUpdated }: ProfileAvatarUploadProps) {
  const { refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);

  const avatarSrc = useMemo(() => {
    const cacheKey = user.updatedAt ?? (previewVersion > 0 ? String(previewVersion) : undefined);
    return getMemberAvatarApiUrl(user.id, user.avatarUrl, cacheKey);
  }, [user.id, user.avatarUrl, user.updatedAt, previewVersion]);

  async function applyUploadResult(data: {
    user?: PublicMember | null;
    avatarSrc?: string | null;
  }) {
    if (!data.user) {
      setError(true);
      setMessage("Photo uploaded but profile did not update. Try again.");
      return;
    }

    onUpdated(data.user);
    await refresh();
    setPreviewVersion(Date.now());
    setError(false);
    setMessage("Profile photo updated.");
  }

  async function uploadAvatar(file: File) {
    const normalized = normalizeAvatarFile(file);
    if (!isAllowedAvatarImage(normalized)) {
      setError(true);
      setMessage("Use JPG, PNG, WEBP, or GIF under 10 MB.");
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(false);

    try {
      const config = await fetchProfileAvatarUploadConfig();

      if (config.directUpload) {
        const data = await uploadProfileAvatarClient(user.id, normalized);
        await applyUploadResult(data);
        return;
      }

      const formData = new FormData();
      formData.append("file", normalized);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(true);
        setMessage(data.error ?? "Could not upload photo.");
        return;
      }

      await applyUploadResult(data);
    } catch (uploadError) {
      setError(true);
      setMessage(
        uploadError instanceof Error ? uploadError.message : "Could not upload photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    if (!user.avatarUrl) return;
    if (!window.confirm("Remove your profile photo?")) return;

    setBusy(true);
    setMessage(null);
    setError(false);

    const response = await fetch("/api/profile/avatar", { method: "DELETE" });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(true);
      setMessage(data.error ?? "Could not remove photo.");
      return;
    }

    if (data.user) {
      onUpdated(data.user);
      await refresh();
      setPreviewVersion(Date.now());
      setError(false);
      setMessage("Profile photo removed.");
    }
  }

  const publicName = getPublicDisplayName(user);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-night-900 text-2xl font-bold text-sand-50 ring-2 ring-sand-200">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt={publicName} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            {publicName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div>
        <p className="font-semibold text-night-900">Profile photo</p>
        <p className="mt-1 text-sm text-night-600">
          JPG, PNG, WEBP, or GIF up to 10 MB. On the app, use the camera or photo picker for best
          results.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadAvatar(file);
              }
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              if (isNativeAppPlatform()) {
                const file = await pickProfilePhotoFile();
                if (file) {
                  await uploadAvatar(file);
                  return;
                }
              }
              inputRef.current?.click();
            }}
          >
            {busy ? "Uploading..." : user.avatarUrl ? "Change photo" : "Upload photo"}
          </Button>
          {user.avatarUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void removeAvatar()}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          ) : null}
        </div>
        {message ? (
          <p className={`mt-2 text-sm ${error ? "text-red-700" : "text-emerald-700"}`}>{message}</p>
        ) : null}
      </div>
    </div>
  );
}
