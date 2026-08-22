"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CommunityStatus } from "@/lib/member-types";

function authorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function StatusAvatar({ name, active }: { name: string; active?: boolean }) {
  return (
    <div
      className={`flex h-[4.35rem] w-[4.35rem] items-center justify-center rounded-full p-[2.5px] ${
        active
          ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600"
          : "bg-gradient-to-tr from-night-300 via-night-400 to-night-500"
      }`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-base font-bold text-night-900">
        {authorInitial(name)}
      </div>
    </div>
  );
}

function StatusViewer({
  status,
  onClose,
}: {
  status: CommunityStatus;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/95 p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white"
      >
        Close
      </button>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-night-900 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <StatusAvatar name={status.authorName} active />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{status.authorName}</p>
            <p className="text-xs text-white/60">Status</p>
          </div>
        </div>
        <div className="relative aspect-[9/16] max-h-[70vh] w-full bg-black">
          {status.mediaType === "video" ? (
            <video
              src={status.mediaUrl}
              controls
              playsInline
              autoPlay
              className="h-full w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={status.mediaUrl} alt="" className="h-full w-full object-contain" />
          )}
        </div>
        {status.caption ? (
          <p className="px-3 py-2.5 text-sm text-white/90">{status.caption}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CommunityStatusRow() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statuses, setStatuses] = useState<CommunityStatus[]>([]);
  const [activeStatus, setActiveStatus] = useState<CommunityStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/community/statuses", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStatuses(data.statuses ?? []))
      .catch(() => setStatuses([]));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CommunityStatus>();
    for (const status of statuses) {
      if (!map.has(status.authorId)) {
        map.set(status.authorId, status);
      }
    }
    return Array.from(map.values());
  }, [statuses]);

  async function uploadStatus(file: File) {
    if (!user) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/community/statuses", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not share status.");
      return;
    }
    setStatuses((current) => [data.status, ...current.filter((entry) => entry.authorId !== user.id)]);
  }

  if (!user) return null;

  return (
    <>
      <div className="mobile-surface !p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-night-500">Statuses</p>
          {uploading ? <span className="text-xs text-night-500">Uploading…</span> : null}
        </div>
        {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
        <div className="mt-2.5 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div className="relative">
              <StatusAvatar name={user.name} active />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0095f6] text-sm font-bold text-white ring-2 ring-white">
                +
              </span>
            </div>
            <span className="max-w-[4.5rem] truncate text-[11px] font-semibold text-night-700">
              Your status
            </span>
          </button>

          {grouped
            .filter((status) => status.authorId !== user.id)
            .map((status) => (
              <button
                key={status.id}
                type="button"
                onClick={() => setActiveStatus(status)}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <StatusAvatar name={status.authorName} active />
                <span className="max-w-[4.5rem] truncate text-[11px] font-semibold text-night-700">
                  {status.authorName.split(" ")[0]}
                </span>
              </button>
            ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadStatus(file);
          }}
        />
      </div>

      {activeStatus ? (
        <StatusViewer status={activeStatus} onClose={() => setActiveStatus(null)} />
      ) : null}
    </>
  );
}
