"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirAcademyShell } from "@/components/groups/choir/academy/ChoirAcademyShell";
import { CHOIR_ACADEMY_PATHS } from "@/lib/choir-academy-paths";
import type { ChoirAcademyPathId } from "@/lib/choir-academy-paths";
import { choirAcademyCourseHref } from "@/lib/choir-academy-links";

type ChoirAcademyManagePageProps = {
  groupId: string;
};

export function ChoirAcademyManagePage({ groupId }: ChoirAcademyManagePageProps) {
  const [pathId, setPathId] = useState<ChoirAcademyPathId>("heart-of-worship");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=home`)
      .then((response) => response.json())
      .then((data) => {
        setCanManage(Boolean(data.payload?.canManageAcademy));
      })
      .catch(() => undefined);
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  async function createCourse(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/groups/choir-academy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_course",
        groupId,
        pathId,
        title,
        description,
        status,
        sequentialLessons: true,
        learningObjectives: [],
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save course.");
      return;
    }
    const courseId = data.course?.id;
    setMessage("Course saved.");
    if (courseId) {
      window.location.href = choirAcademyCourseHref(groupId, courseId);
    }
  }

  if (!canManage) {
    return <p className="px-4 py-3 text-sm text-red-700">You do not have permission to manage the academy.</p>;
  }

  return (
    <ChoirAcademyShell
      groupId={groupId}
      groupChatHref={`/groups/${encodeURIComponent(groupId)}?chat=1`}
      title="Manage academy"
      subtitle="Create and publish worship training courses."
      showTabs={false}
    >
      <form className="choir-card space-y-3 p-4" onSubmit={createCourse}>
        <label className="block text-sm font-semibold text-[var(--choir-heading)]">
          Learning path
          <select
            className="choir-setlist-search mt-1 w-full"
            value={pathId}
            onChange={(event) => setPathId(event.target.value as ChoirAcademyPathId)}
          >
            {CHOIR_ACADEMY_PATHS.map((path) => (
              <option key={path.id} value={path.id}>{path.title}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-[var(--choir-heading)]">
          Course title
          <input
            className="choir-setlist-search mt-1 w-full"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--choir-heading)]">
          Description
          <textarea
            className="choir-announcement-textarea mt-1 w-full min-h-[96px]"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--choir-heading)]">
          Publication
          <select
            className="choir-setlist-search mt-1 w-full"
            value={status}
            onChange={(event) => setStatus(event.target.value as "draft" | "published")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        {message ? <p className="text-sm text-[var(--choir-body)]">{message}</p> : null}
        <button type="submit" className="choir-btn-primary w-full" disabled={busy}>
          Save course
        </button>
      </form>
      <p className="text-xs text-[var(--choir-muted)]">
        After saving, open the course to add lessons (video links, readings, documents, and quizzes) from the course page.
        Use lesson management API actions from future studio tools or contact your developer for bulk imports.
      </p>
      <Link href={`/groups/${encodeURIComponent(groupId)}/academy`} className="choir-setlist-manage-link block text-center">
        Back to academy →
      </Link>
    </ChoirAcademyShell>
  );
}
