"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ChoirAcademyCourseCard,
  ChoirAcademyPathGrid,
  ChoirAcademyShell,
} from "@/components/groups/choir/academy/ChoirAcademyShell";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";
import type { ChoirAcademyHomePayload } from "@/lib/choir-academy-types";
import { choirAcademyCoursesHref } from "@/lib/choir-academy-links";

type ChoirAcademyHomePageProps = {
  groupId: string;
};

export function ChoirAcademyHomePage({ groupId }: ChoirAcademyHomePageProps) {
  const [payload, setPayload] = useState<ChoirAcademyHomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=home`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load academy.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load academy.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  if (loading) {
    return (
      <div className="choir-group-home choir-academy-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading Worship Academy…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-academy-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
      </div>
    );
  }

  const stats = payload.stats;

  return (
    <ChoirAcademyShell groupId={groupId} groupChatHref={payload.groupChatHref}>
      <div className="choir-calendar-hero choir-page-bleed">
        <Image src={CHOIR_HERO_IMAGE_PATH} alt="" fill className="object-cover object-center" sizes="100vw" priority />
        <div className="choir-calendar-hero-overlay" />
        <div className="choir-calendar-hero-copy">
          <p className="choir-calendar-hero-kicker">Shanah Worship Academy</p>
          <h2 className="choir-calendar-hero-title font-display">
            Grow Your Gift.
            <br />
            Deepen Your Worship.
          </h2>
          <p className="choir-calendar-hero-sub">
            Equipping hearts, voices, and musicians for excellence in ministry.
          </p>
        </div>
      </div>

      <div className="choir-academy-stats" aria-label="Learning overview">
        <div className="choir-academy-stat">
          <span className="choir-academy-stat-icon" aria-hidden>📚</span>
          <p className="choir-academy-stat-value">{stats.learningPathCount}</p>
          <p className="choir-academy-stat-label">Learning paths</p>
        </div>
        <div className="choir-academy-stat">
          <span className="choir-academy-stat-icon" aria-hidden>▶</span>
          <p className="choir-academy-stat-value">{stats.coursesInProgress}</p>
          <p className="choir-academy-stat-label">In progress</p>
        </div>
        <div className="choir-academy-stat">
          <span className="choir-academy-stat-icon" aria-hidden>◎</span>
          <p className="choir-academy-stat-value">{stats.overallProgressPercent}%</p>
          <p className="choir-academy-stat-label">My progress</p>
        </div>
        <div className="choir-academy-stat">
          <span className="choir-academy-stat-icon" aria-hidden>🏆</span>
          <p className="choir-academy-stat-value">{stats.completedCourses}</p>
          <p className="choir-academy-stat-label">Completed</p>
        </div>
      </div>

      <section aria-labelledby="choir-academy-readiness">
        <h2 id="choir-academy-readiness" className="choir-section-heading text-base">
          {payload.readiness.title}
        </h2>
        <div className="choir-card mt-2 p-4">
          <p className="text-sm font-bold text-[var(--choir-heading)]">{payload.readiness.statusLabel}</p>
          <p className="mt-1 text-sm text-[var(--choir-body)]">{payload.readiness.detail}</p>
          <Link href={payload.readiness.actionHref} className="choir-setlist-manage-link mt-3 inline-block">
            {payload.readiness.actionLabel} →
          </Link>
        </div>
      </section>

      <section aria-labelledby="choir-academy-continue">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="choir-academy-continue" className="choir-section-heading text-base">Continue learning</h2>
          <Link href={choirAcademyCoursesHref(groupId)} className="text-xs font-bold text-[var(--choir-gold-dark)]">
            View all
          </Link>
        </div>
        {payload.continueCourse ? (
          <ChoirAcademyCourseCard course={payload.continueCourse} actionLabel="Continue lesson" />
        ) : (
          <div className="choir-card p-5 text-center">
            <p className="font-bold text-[var(--choir-heading)]">No courses in progress</p>
            <p className="mt-2 text-sm text-[var(--choir-muted)]">
              Browse published courses when your leaders add them, or explore learning paths below.
            </p>
            <Link href={choirAcademyCoursesHref(groupId)} className="choir-btn-primary mt-4 inline-flex">
              Browse courses
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="choir-academy-paths">
        <h2 id="choir-academy-paths" className="choir-section-heading text-base">Explore learning paths</h2>
        <ChoirAcademyPathGrid paths={payload.paths} />
      </section>

      <p className="choir-academy-footer-note text-center">
        <span aria-hidden>🎓</span> Build your skills. Grow in your calling.
      </p>

      {payload.canManageAcademy ? (
        <Link href={payload.manageHref} className="choir-setlist-manage-link block text-center">
          Manage academy →
        </Link>
      ) : null}
    </ChoirAcademyShell>
  );
}
