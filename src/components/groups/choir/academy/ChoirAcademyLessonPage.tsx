"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorshipYouTubeReference } from "@/components/worship/WorshipYouTubeReference";
import { ChoirAcademyShell } from "@/components/groups/choir/academy/ChoirAcademyShell";
import type { ChoirAcademyLessonPayload } from "@/lib/choir-academy-types";

type ChoirAcademyLessonPageProps = {
  groupId: string;
  courseId: string;
  lessonId: string;
};

export function ChoirAcademyLessonPage({ groupId, courseId, lessonId }: ChoirAcademyLessonPageProps) {
  const [payload, setPayload] = useState<ChoirAcademyLessonPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizMessage, setQuizMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(
      `/api/groups/choir-academy?groupId=${encodeURIComponent(groupId)}&view=lesson&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Lesson not found.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load lesson.");
        setLoading(false);
      });
  }, [groupId, courseId, lessonId]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  async function markComplete() {
    setBusy(true);
    const response = await fetch("/api/groups/choir-academy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_lesson_complete",
        groupId,
        courseId,
        lessonId,
      }),
    });
    setBusy(false);
    if (response.ok) {
      load();
    }
  }

  async function submitQuiz() {
    setBusy(true);
    setQuizMessage(null);
    const response = await fetch("/api/groups/choir-academy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_quiz",
        groupId,
        courseId,
        lessonId,
        answers: quizAnswers,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setQuizMessage(data.error ?? "Could not submit quiz.");
      return;
    }
    if (!data.passed) {
      setQuizMessage(`Score ${data.percent}% — review the material and try again.`);
      return;
    }
    setQuizMessage(`Score ${data.percent}% — great work!`);
    load();
  }

  if (loading) return <p className="px-4 py-3 text-sm text-[var(--choir-muted)]">Loading lesson…</p>;
  if (error || !payload) return <p className="px-4 py-3 text-sm text-red-700">{error ?? "Not found."}</p>;

  const lesson = payload.lesson;
  const completed = payload.progress.completedLessonIds.includes(lesson.id);

  return (
    <ChoirAcademyShell
      groupId={groupId}
      groupChatHref={`/groups/${encodeURIComponent(groupId)}?chat=1`}
      title={lesson.title}
      subtitle={payload.courseTitle}
      showTabs={false}
    >
      <div className="choir-card p-4 space-y-4">
        {lesson.type === "video" && lesson.youtubeVideoId ? (
          <WorshipYouTubeReference videoId={lesson.youtubeVideoId} title={lesson.title} />
        ) : null}

        {lesson.type === "audio" && lesson.mediaUrl ? (
          <audio controls className="w-full" src={lesson.mediaUrl}>
            Audio lesson
          </audio>
        ) : null}

        {lesson.type === "article" && lesson.bodyMarkdown ? (
          <div className="prose prose-sm max-w-none text-[var(--choir-body)] whitespace-pre-wrap">
            {lesson.bodyMarkdown}
          </div>
        ) : null}

        {lesson.type === "document" && lesson.documentPath ? (
          <Link href={lesson.documentPath} className="choir-btn-secondary inline-flex" target="_blank" rel="noreferrer">
            Open document
          </Link>
        ) : null}

        {lesson.type === "link" && lesson.mediaUrl ? (
          <a href={lesson.mediaUrl} className="choir-btn-secondary inline-flex" target="_blank" rel="noreferrer">
            Open resource
          </a>
        ) : null}

        {lesson.type === "quiz" && lesson.quiz ? (
          <div className="space-y-4">
            {lesson.quiz.questions.map((question, index) => (
              <div key={question.id} className="rounded-xl border border-[var(--choir-border)] p-3">
                <p className="font-semibold text-[var(--choir-heading)]">
                  {index + 1}. {question.prompt}
                </p>
                {question.type === "reflection" ? (
                  <p className="mt-2 text-xs text-[var(--choir-muted)]">
                    Reflection — complete this thoughtfully, then mark the lesson complete.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {(question.options ?? []).map((option, optionIndex) => (
                      <li key={option}>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={question.id}
                            checked={quizAnswers[question.id] === optionIndex}
                            onChange={() =>
                              setQuizAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                            }
                          />
                          {option}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {quizMessage ? <p className="text-sm text-[var(--choir-body)]">{quizMessage}</p> : null}
            <button type="button" className="choir-btn-primary w-full" disabled={busy} onClick={submitQuiz}>
              Submit quiz
            </button>
          </div>
        ) : null}

        {!lesson.quiz && lesson.type !== "quiz" ? (
          <button type="button" className="choir-btn-primary w-full" disabled={busy || completed} onClick={markComplete}>
            {completed ? "Lesson completed" : "Mark complete"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {payload.previousHref ? (
          <Link href={payload.previousHref} className="choir-btn-secondary text-center">Previous lesson</Link>
        ) : null}
        {payload.nextHref ? (
          <Link href={payload.nextHref} className="choir-btn-primary text-center">Next lesson</Link>
        ) : null}
        <Link href={payload.courseHref} className="choir-setlist-manage-link text-center">Back to course</Link>
      </div>
    </ChoirAcademyShell>
  );
}
