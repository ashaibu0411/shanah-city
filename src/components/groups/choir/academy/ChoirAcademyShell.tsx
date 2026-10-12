"use client";

import Link from "next/link";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { ChoirAcademyTabs } from "@/components/groups/choir/academy/ChoirAcademyTabs";
import "../choir-premium.css";

type ChoirAcademyShellProps = {
  groupId: string;
  groupChatHref: string;
  title?: string;
  subtitle?: string;
  showTabs?: boolean;
  children: React.ReactNode;
};

export function ChoirAcademyShell({
  groupId,
  groupChatHref,
  title = "Worship Academy",
  subtitle = "Grow your gift. Deepen your worship.",
  showTabs = true,
  children,
}: ChoirAcademyShellProps) {
  return (
    <div className="choir-group-home choir-academy-page choir-calendar-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={groupChatHref} />
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">{title}</h1>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">{subtitle}</p>
      </div>
      {showTabs ? <ChoirAcademyTabs groupId={groupId} /> : null}
      {children}
    </div>
  );
}

export function ChoirAcademyCourseCard({
  course,
  actionLabel,
}: {
  course: {
    href: string;
    coverImagePath: string;
    pathTitle: string;
    title: string;
    description: string;
    lessonCount: number;
    progress: { percent: number; nextLessonHref?: string | null };
  };
  actionLabel?: string;
}) {
  const continueHref = course.progress.nextLessonHref ?? course.href;
  const label =
    actionLabel ??
    (course.progress.percent === 0 ? "Start" : course.progress.percent === 100 ? "Review" : "Continue");

  return (
    <article className="choir-academy-continue-card">
      <Link href={course.href} className="choir-academy-continue-thumb-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={course.coverImagePath} alt="" className="choir-academy-continue-thumb" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="choir-academy-course-kicker">{course.pathTitle}</p>
        <Link href={course.href} className="choir-academy-continue-title">{course.title}</Link>
        <p className="choir-academy-continue-meta">
          {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
          {course.progress.percent > 0 ? ` · ${course.progress.percent}% complete` : ""}
        </p>
        <div className="choir-academy-progress-track" aria-hidden>
          <span className="choir-academy-progress-fill" style={{ width: `${course.progress.percent}%` }} />
        </div>
      </div>
      <Link href={label === "Continue" ? continueHref : course.href} className="choir-academy-continue-btn">
        {label} <span aria-hidden>›</span>
      </Link>
    </article>
  );
}

export function ChoirAcademyPathGrid({
  paths,
}: {
  paths: {
    href: string;
    icon: string;
    title: string;
    description: string;
    publishedCourseCount: number;
  }[];
}) {
  return (
    <div className="choir-academy-path-grid">
      {paths.map((path) => (
        <Link key={path.title} href={path.href} className="choir-academy-path-card">
          <span className="choir-academy-path-icon" aria-hidden>{path.icon}</span>
          <p className="choir-academy-path-title">{path.title}</p>
          <p className="choir-academy-path-desc">{path.description}</p>
          <p className="choir-academy-path-count">
            {path.publishedCourseCount === 0
              ? "Courses coming soon"
              : `${path.publishedCourseCount} course${path.publishedCourseCount === 1 ? "" : "s"}`}
          </p>
          <span className="choir-academy-path-chevron" aria-hidden>›</span>
        </Link>
      ))}
    </div>
  );
}
