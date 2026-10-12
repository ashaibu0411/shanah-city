"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChoirAcademyCourseCard, ChoirAcademyShell } from "@/components/groups/choir/academy/ChoirAcademyShell";
import type { ChoirAcademyCourseCardView } from "@/lib/choir-academy-types";
import { CHOIR_ACADEMY_PATHS } from "@/lib/choir-academy-paths";

type ChoirAcademyCoursesPageProps = {
  groupId: string;
};

type FilterId = "all" | "my" | string;

export function ChoirAcademyCoursesPage({ groupId }: ChoirAcademyCoursesPageProps) {
  const [courses, setCourses] = useState<ChoirAcademyCourseCardView[]>([]);
  const [groupChatHref, setGroupChatHref] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=courses`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load courses.");
        } else {
          setCourses(data.payload.courses ?? []);
          setGroupChatHref(data.payload.groupChatHref);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load courses.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  const filters = useMemo(() => {
    const pathFilters = CHOIR_ACADEMY_PATHS.filter((path) =>
      courses.some((course) => course.pathId === path.id),
    ).map((path) => ({ id: path.id, label: path.title }));
    return [{ id: "all", label: "All courses" }, { id: "my", label: "My courses" }, ...pathFilters];
  }, [courses]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      if (filter === "my" && course.progress.percent === 0) return false;
      if (filter !== "all" && filter !== "my" && course.pathId !== filter) return false;
      if (!query) return true;
      return (
        course.title.toLowerCase().includes(query) ||
        course.pathTitle.toLowerCase().includes(query) ||
        (course.instructorName?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [courses, filter, search]);

  if (loading) {
    return <p className="px-4 py-3 text-sm text-[var(--choir-muted)]">Loading courses…</p>;
  }

  if (error) {
    return <p className="px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  return (
    <ChoirAcademyShell
      groupId={groupId}
      groupChatHref={groupChatHref}
      title="Course library"
      subtitle="Published training for Shanah Worship."
    >
      <input
        type="search"
        className="choir-setlist-search"
        placeholder="Search courses…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="choir-calendar-filter-row">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`choir-calendar-filter ${filter === item.id ? "is-active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="choir-card p-5 text-center">
          <p className="font-bold text-[var(--choir-heading)]">No published courses yet</p>
          <p className="mt-2 text-sm text-[var(--choir-muted)]">
            When leaders publish academy courses, they will appear here.
          </p>
          <Link href={`/groups/${encodeURIComponent(groupId)}/academy`} className="choir-setlist-manage-link mt-3 inline-block">
            Back to academy home →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((course) => (
            <li key={course.id}>
              <ChoirAcademyCourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </ChoirAcademyShell>
  );
}
