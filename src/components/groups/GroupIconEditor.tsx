"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { getGroupArtwork } from "@/lib/group-artwork";
import type { GroupDetail } from "@/lib/group-types";

type GroupIconEditorProps = {
  group: GroupDetail;
  canManage: boolean;
  onUpdated: (group: GroupDetail) => void;
  onStatus: (message: string, isError?: boolean) => void;
};

export function GroupIconEditor({
  group,
  canManage,
  onUpdated,
  onStatus,
}: GroupIconEditorProps) {
  const [busy, setBusy] = useState(false);
  const iconSrc = useMemo(() => getGroupArtwork(group, "square"), [group]);

  async function uploadIcon(file: File) {
    setBusy(true);
    onStatus("");
    const formData = new FormData();
    formData.set("groupId", group.id);
    formData.set("file", file);

    const response = await fetch("/api/groups/icon", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      onStatus(data.error ?? "Could not upload icon.", true);
      return;
    }

    if (data.group) onUpdated(data.group as GroupDetail);
    onStatus("Group icon updated.");
  }

  async function removeIcon() {
    setBusy(true);
    onStatus("");
    const response = await fetch(
      `/api/groups/icon?groupId=${encodeURIComponent(group.id)}`,
      { method: "DELETE" },
    );
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      onStatus(data.error ?? "Could not remove icon.", true);
      return;
    }

    if (data.group) onUpdated(data.group as GroupDetail);
    onStatus("Group icon removed.");
  }

  return (
    <div className="rounded-2xl border border-night-900/10 bg-sand-50/70 p-4">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-night-900 ring-1 ring-night-900/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-night-900">Group icon</p>
          <p className="mt-1 text-xs text-night-600">
            Upload a square logo or photo. It appears on the group page, group list, and chat.
          </p>
          {canManage ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadIcon(file);
                    event.target.value = "";
                  }}
                />
                <span className="inline-flex rounded-full bg-night-900 px-4 py-2 text-xs font-bold text-white">
                  {busy ? "Uploading…" : "Upload icon"}
                </span>
              </label>
              {group.iconUrl ? (
                <Button variant="secondary" disabled={busy} onClick={() => void removeIcon()}>
                  Remove
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-night-500">Only group leaders can change the icon.</p>
          )}
        </div>
      </div>
    </div>
  );
}
