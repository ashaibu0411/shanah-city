"use client";

import { useMemo, useRef, useState } from "react";
import type { PublicMember } from "@/lib/auth-types";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMemberAvatarApiUrl } from "@/lib/avatar-utils";
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

  const avatarSrc = useMemo(
    () => getMemberAvatarApiUrl(user.id, user.avatarUrl, user.updatedAt),
    [user.id, user.avatarUrl, user.updatedAt],
  );

  async function uploadAvatar(file: File) {
    setBusy(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not upload photo.");
      return;
    }

    if (data.user) {
      onUpdated(data.user);
      await refresh();
      setMessage("Profile photo updated.");
    }
  }

  async function removeAvatar() {
    if (!user.avatarUrl) return;
    if (!window.confirm("Remove your profile photo?")) return;

    setBusy(true);
    setMessage(null);

    const response = await fetch("/api/profile/avatar", { method: "DELETE" });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error ?? "Could not remove photo.");
      return;
    }

    if (data.user) {
      onUpdated(data.user);
      await refresh();
      setMessage("Profile photo removed.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-night-900 text-2xl font-bold text-sand-50 ring-2 ring-sand-200">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div>
        <p className="font-semibold text-night-900">Profile photo</p>
        <p className="mt-1 text-sm text-night-600">
          Upload a photo after you create your account. JPG, PNG, WEBP, or GIF up to 10 MB.
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
                uploadAvatar(file);
              }
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading..." : user.avatarUrl ? "Change photo" : "Upload photo"}
          </Button>
          {user.avatarUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={removeAvatar}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          ) : null}
        </div>
        {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
      </div>
    </div>
  );
}
