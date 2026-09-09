"use client";

import { useEffect, useState } from "react";
import { Button, ExternalLink } from "@/components/ui";
import type { GroupResourceRecord } from "@/lib/group-resource-types";

type GroupResourcesPanelProps = {
  groupId: string;
  isLeader: boolean;
};

export function GroupResourcesPanel({ groupId, isLeader }: GroupResourcesPanelProps) {
  const [resources, setResources] = useState<GroupResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  async function loadResources() {
    setLoading(true);
    const response = await fetch(`/api/groups/resources?groupId=${encodeURIComponent(groupId)}`);
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setResources(data.resources ?? []);
    } else {
      setMessage(data.error ?? "Could not load resources.");
    }
  }

  useEffect(() => {
    void loadResources();
  }, [groupId]);

  async function addResource() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/groups/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, title, url, description }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not add resource.");
      return;
    }
    setTitle("");
    setUrl("");
    setDescription("");
    await loadResources();
  }

  async function deleteResource(id: string) {
    setBusy(true);
    const response = await fetch("/api/groups/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setBusy(false);
    if (response.ok) {
      await loadResources();
    }
  }

  if (loading) {
    return <p className="mt-4 text-sm text-night-600">Loading resources…</p>;
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-night-700">
        Books, videos, and worksheets to strengthen your marriage. Only Power Couples members can see
        this shelf.
      </p>

      {resources.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-600">
          No resources yet.{isLeader ? " Add your first link below." : ""}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="rounded-2xl border border-night-900/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-night-900">{resource.title}</p>
                  {resource.description ? (
                    <p className="mt-1 text-sm text-night-600">{resource.description}</p>
                  ) : null}
                  {resource.url ? (
                    <ExternalLink
                      href={resource.url}
                      className="mt-2 inline-flex text-sm font-semibold text-teal-800 underline-offset-2 hover:underline"
                    >
                      Open resource →
                    </ExternalLink>
                  ) : null}
                </div>
                {isLeader ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteResource(resource.id)}
                    className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isLeader ? (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
          <p className="text-sm font-semibold text-night-900">Add a resource</p>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-night-600">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-night-600">Link (optional)</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-night-600">Description (optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <Button className="mt-3" disabled={busy || !title.trim()} onClick={addResource}>
            {busy ? "Saving…" : "Add resource"}
          </Button>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-night-600">{message}</p> : null}
    </div>
  );
}
