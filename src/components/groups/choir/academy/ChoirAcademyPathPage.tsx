"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirAcademyCourseCard, ChoirAcademyShell } from "@/components/groups/choir/academy/ChoirAcademyShell";
import type { ChoirAcademyPathPayload } from "@/lib/choir-academy-types";
import { choirAcademyHomeHref } from "@/lib/choir-academy-links";

type ChoirAcademyPathPageProps = {
  groupId: string;
  pathId: string;
};

export function ChoirAcademyPathPage({ groupId, pathId }: ChoirAcademyPathPageProps) {
  const [payload, setPayload] = useState<ChoirAcademyPathPayload | null>(null);
  const [groupChatHref, setGroupChatHref] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(
      `/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=path&pathId=${encodeURIComponent(pathId)}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Learning path not found.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setGroupChatHref(`/groups/${encodeURIComponent(groupId)}?chat=1`);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load learning path.");
        setLoading(false);
      });
  }, [groupId, pathId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  if (loading) return <p className="px-4 py-3 text-sm text-[var(--choir-muted)]">Loading path…</p>;
  if (error || !payload) return <p className="px-4 py-3 text-sm text-red-700">{error ?? "Not found."}</p>;

  return (
    <ChoirAcademyShell
      groupId={groupId}
      groupChatHref={groupChatHref}
      title={payload.path.title}
      subtitle={payload.path.description}
      showTabs={false}
    >
      {payload.courses.length === 0 ? (
        <div className="choir-card p-5 text-center">
          <p className="font-bold text-[var(--choir-heading)]">No published courses in this path</p>
          <p className="mt-2 text-sm text-[var(--choir-muted)]">
            Check back when your worship leaders publish training for {payload.path.title}.
          </p>
          <Link href={choirAcademyHomeHref(groupId)} className="choir-setlist-manage-link mt-3 inline-block">
            Back to academy →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {payload.courses.map((course) => (
            <li key={course.id}>
              <ChoirAcademyCourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </ChoirAcademyShell>
  );
}
