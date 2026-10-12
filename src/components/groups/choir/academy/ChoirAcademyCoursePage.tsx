"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChoirAcademyShell } from "@/components/groups/choir/academy/ChoirAcademyShell";
import type { ChoirAcademyCourseDetailPayload } from "@/lib/choir-academy-types";

type ChoirAcademyCoursePageProps = {
  groupId: string;
  courseId: string;
};

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  article: "Reading",
  document: "Document",
  link: "Resource",
  quiz: "Quiz",
};

export function ChoirAcademyCoursePage({ groupId, courseId }: ChoirAcademyCoursePageProps) {
  const [payload, setPayload] = useState<ChoirAcademyCourseDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("article");
  const [lessonBody, setLessonBody] = useState("");
  const [lessonMedia, setLessonMedia] = useState("");
  const [lessonBusy, setLessonBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(
      `/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=course&courseId=${encodeURIComponent(courseId)}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Course not found.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load course.");
        setLoading(false);
      });
  }, [groupId, courseId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  async function addLesson(event: React.FormEvent) {
    event.preventDefault();
    if (!payload) return;
    setLessonBusy(true);
    await fetch("/api/groups/choir-academy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_lesson",
        groupId,
        courseId,
        title: lessonTitle,
        type: lessonType,
        bodyMarkdown: lessonBody,
        mediaUrl: lessonMedia,
        youtubeVideoId: lessonMedia,
        sortOrder: payload.lessons.length,
      }),
    });
    setLessonTitle("");
    setLessonBody("");
    setLessonMedia("");
    setLessonBusy(false);
    load();
  }

  if (loading) return <p className="px-4 py-3 text-sm text-[var(--choir-muted)]">Loading course…</p>;
  if (error || !payload) return <p className="px-4 py-3 text-sm text-red-700">{error ?? "Not found."}</p>;

  const course = payload.course;
  const startHref = course.progress.nextLessonHref ?? payload.lessons.find((lesson) => !lesson.locked)?.href;

  return (
    <ChoirAcademyShell
      groupId={groupId}
      groupChatHref={`/groups/${encodeURIComponent(groupId)}?chat=1`}
      title={course.title}
      subtitle={course.pathTitle}
      showTabs={false}
    >
      <div className="choir-card overflow-hidden">
        <div className="relative aspect-[16/9] w-full bg-[var(--choir-hero-dark)]">
          <Image src={course.coverImagePath} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="p-4">
          {course.instructorName ? (
            <p className="text-sm text-[var(--choir-muted)]">Instructor: {course.instructorName}</p>
          ) : null}
          <p className="mt-2 text-sm text-[var(--choir-body)]">{course.description}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--choir-heading)]">
            {course.lessonCount} lessons · {course.progress.percent}% complete
          </p>
          {startHref ? (
            <Link href={startHref} className="choir-btn-primary mt-4 inline-flex w-full justify-center">
              {course.progress.percent > 0 ? "Continue course" : "Start course"}
            </Link>
          ) : null}
        </div>
      </div>

      {course.learningObjectives.length > 0 ? (
        <section className="choir-card p-4">
          <h2 className="font-bold text-[var(--choir-heading)]">Learning objectives</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--choir-body)]">
            {course.learningObjectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {payload.canManageAcademy ? (
        <form className="choir-card space-y-3 p-4" onSubmit={addLesson}>
          <h2 className="font-bold text-[var(--choir-heading)]">Add lesson</h2>
          <input
            className="choir-setlist-search w-full"
            placeholder="Lesson title"
            value={lessonTitle}
            onChange={(event) => setLessonTitle(event.target.value)}
            required
          />
          <select
            className="choir-setlist-search w-full"
            value={lessonType}
            onChange={(event) => setLessonType(event.target.value)}
          >
            <option value="article">Written lesson</option>
            <option value="video">Video (YouTube URL)</option>
            <option value="audio">Audio URL</option>
            <option value="document">Document path (/path)</option>
            <option value="link">External link</option>
            <option value="quiz">Quiz (configure later)</option>
          </select>
          {lessonType === "article" ? (
            <textarea
              className="choir-announcement-textarea w-full min-h-[80px]"
              placeholder="Lesson content"
              value={lessonBody}
              onChange={(event) => setLessonBody(event.target.value)}
            />
          ) : (
            <input
              className="choir-setlist-search w-full"
              placeholder="Resource URL or path"
              value={lessonMedia}
              onChange={(event) => setLessonMedia(event.target.value)}
            />
          )}
          <button type="submit" className="choir-btn-secondary w-full" disabled={lessonBusy}>
            Add lesson
          </button>
        </form>
      ) : null}

      <section aria-labelledby="choir-lesson-list">
        <h2 id="choir-lesson-list" className="choir-section-heading text-base">Lessons</h2>
        <ul className="mt-2 space-y-2">
          {payload.lessons.map((lesson) => (
            <li key={lesson.id}>
              {lesson.locked ? (
                <div className="choir-academy-lesson-row is-locked">
                  <span className="choir-academy-lesson-num">{lesson.number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--choir-heading)]">{lesson.title}</p>
                    <p className="text-xs text-[var(--choir-muted)]">
                      {TYPE_LABEL[lesson.type] ?? lesson.type} · Complete previous lessons to unlock
                    </p>
                  </div>
                </div>
              ) : (
                <Link href={lesson.href} className="choir-academy-lesson-row">
                  <span className="choir-academy-lesson-num">{lesson.number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--choir-heading)]">{lesson.title}</p>
                    <p className="text-xs text-[var(--choir-muted)]">
                      {TYPE_LABEL[lesson.type] ?? lesson.type}
                      {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ""}
                      {lesson.completed ? " · Completed" : ""}
                    </p>
                  </div>
                  <span aria-hidden>›</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </ChoirAcademyShell>
  );
}
