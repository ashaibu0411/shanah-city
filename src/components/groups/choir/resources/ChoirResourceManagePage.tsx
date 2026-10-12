"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { choirResourcesHref } from "@/lib/choir-resource-links";
import type { ChoirResourceTabId } from "@/lib/choir-resource-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import "../choir-premium.css";

type ChoirResourceManagePageProps = {
  groupId: string;
};

export function ChoirResourceManagePage({ groupId }: ChoirResourceManagePageProps) {
  const [canManage, setCanManage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<ChoirResourceTabId>("resources");
  const [category, setCategory] = useState("General");
  const [kind, setKind] = useState("pdf");
  const [featured, setFeatured] = useState(false);
  const [featuredBadge, setFeaturedBadge] = useState("");
  const [fileSizeLabel, setFileSizeLabel] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [requests, setRequests] = useState<
    { id: string; title: string; userName: string; status: string; createdAt: string }[]
  >([]);

  const load = useCallback(() => {
    fetch(`/api/groups/choir-resources?groupId=${encodeURIComponent(groupId)}&view=home`)
      .then((response) => response.json())
      .then((data) => setCanManage(Boolean(data.payload?.canManage)))
      .catch(() => undefined);
    fetch(`/api/groups/choir-resources?groupId=${encodeURIComponent(groupId)}&view=leader_requests`)
      .then((response) => response.json())
      .then((data) => {
        if (data.requests) setRequests(data.requests);
      })
      .catch(() => undefined);
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  async function saveResource(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/groups/choir-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_resource",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        title,
        description,
        url,
        tab,
        category,
        kind,
        featured,
        featuredBadge,
        fileSizeLabel,
        status,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Could not save resource.");
      return;
    }
    setMessage("Resource saved.");
    setTitle("");
    setDescription("");
    setUrl("");
  }

  async function updateRequestStatus(requestId: string, nextStatus: string) {
    await fetch("/api/groups/choir-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_request_status",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        requestId,
        status: nextStatus,
      }),
    });
    load();
  }

  if (!canManage) {
    return <p className="px-4 py-3 text-sm text-red-700">You do not have permission to manage resources.</p>;
  }

  return (
    <div className="choir-group-home choir-resources-page choir-page-shell space-y-5 pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={`/groups/${encodeURIComponent(groupId)}?chat=1`} />
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Manage resources</h1>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">Publish files and links for the worship team.</p>
      </div>

      <form className="choir-card space-y-3 p-4" onSubmit={saveResource}>
        <input className="choir-setlist-search w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="choir-announcement-textarea w-full min-h-[72px]" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="choir-setlist-search w-full" placeholder="URL or internal path (/groups/...)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <select className="choir-setlist-search w-full" value={tab} onChange={(e) => setTab(e.target.value as ChoirResourceTabId)}>
          <option value="resources">Resources</option>
          <option value="guides">Ministry Guides</option>
          <option value="onboarding">Onboarding</option>
          <option value="forms">Forms</option>
          <option value="links">Helpful Links</option>
        </select>
        <input className="choir-setlist-search w-full" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <select className="choir-setlist-search w-full" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="xlsx">XLSX</option>
          <option value="external_url">External link</option>
          <option value="internal_route">Internal app route</option>
          <option value="video_link">Video link</option>
        </select>
        <input className="choir-setlist-search w-full" placeholder="File size label (e.g. PDF · 1.2 MB)" value={fileSizeLabel} onChange={(e) => setFileSizeLabel(e.target.value)} />
        <input className="choir-setlist-search w-full" placeholder="Featured badge (optional)" value={featuredBadge} onChange={(e) => setFeaturedBadge(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured on home
        </label>
        <select className="choir-setlist-search w-full" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {message ? <p className="text-sm text-[var(--choir-body)]">{message}</p> : null}
        <button type="submit" className="choir-btn-primary w-full">Save resource</button>
      </form>

      <section>
        <h2 className="choir-section-heading text-base">Resource requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No open requests.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {requests.map((request) => (
              <li key={request.id} className="choir-card p-3 text-sm">
                <p className="font-bold text-[var(--choir-heading)]">{request.title}</p>
                <p className="text-[var(--choir-muted)]">{request.userName} · {request.status}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["under_review", "fulfilled", "closed"] as const).map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      className="choir-btn-secondary !min-h-8 px-2 text-xs"
                      onClick={() => updateRequestStatus(request.id, statusOption)}
                    >
                      {statusOption.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href={choirResourcesHref(groupId)} className="choir-setlist-manage-link block text-center">
        Back to resource center →
      </Link>
    </div>
  );
}
