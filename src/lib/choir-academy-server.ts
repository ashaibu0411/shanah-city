import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  choirAcademyAchievementsHref,
  choirAcademyCourseHref,
  choirAcademyHomeHref,
  choirAcademyLessonHref,
  choirAcademyManageHref,
  choirAcademyPathHref,
} from "@/lib/choir-academy-links";
import {
  CHOIR_ACADEMY_PATHS,
  choirAcademyPathById,
  type ChoirAcademyPathId,
} from "@/lib/choir-academy-paths";
import type {
  ChoirAcademyAchievementView,
  ChoirAcademyCourse,
  ChoirAcademyCourseCardView,
  ChoirAcademyCourseDetailPayload,
  ChoirAcademyCourseProgressView,
  ChoirAcademyHomePayload,
  ChoirAcademyLesson,
  ChoirAcademyLessonPayload,
  ChoirAcademyLessonProgress,
  ChoirAcademyLessonRowView,
  ChoirAcademyPathPayload,
  ChoirAcademyQuiz,
  ChoirAcademyReadinessView,
} from "@/lib/choir-academy-types";
import { getGroupDetail } from "@/lib/group-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import {
  getReadinessStatusForGroup,
  isMemberTrainingRequired,
} from "@/lib/ministry-readiness-server";
import { parseYouTubeVideoId } from "@/lib/media-clips-utils";
import {
  createChoirAcademyAssignmentJson,
  deleteChoirAcademyLessonJson,
  listChoirAcademyAssignmentsForUserJson,
  listChoirAcademyCoursesJson,
  listChoirAcademyLessonsJson,
  listChoirAcademyProgressForUserJson,
  markChoirAcademyLessonCompleteJson,
  upsertChoirAcademyCourseJson,
  upsertChoirAcademyLessonJson,
} from "@/lib/stores/choir-academy-json";

function groupChatHref(groupId: string) {
  return `/groups/${encodeURIComponent(groupId)}?chat=1`;
}

export async function assertChoirAcademyAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return null;
  }
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember && !(await canManageAsAdmin(user))) {
    return null;
  }
  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return null;
  }
  return group;
}

export async function canManageChoirAcademy(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return false;
  if (await canManageAsAdmin(user)) return true;
  return canManageGroupEvents(user, groupId);
}

function lessonsForCourse(lessons: ChoirAcademyLesson[], courseId: string) {
  return lessons
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function buildProgressView(
  groupId: string,
  course: ChoirAcademyCourse,
  lessons: ChoirAcademyLesson[],
  progress: ChoirAcademyLessonProgress[],
): ChoirAcademyCourseProgressView {
  const ordered = lessonsForCourse(lessons, course.id);
  const completedLessonIds = progress
    .filter((row) => row.courseId === course.id)
    .map((row) => row.lessonId);
  const total = ordered.length;
  const completedCount = ordered.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const completedAt =
    total > 0 && completedCount === total
      ? progress
          .filter((row) => row.courseId === course.id)
          .map((row) => row.completedAt)
          .sort()
          .at(-1)
      : undefined;

  let nextLessonId: string | null = null;
  if (course.sequentialLessons) {
    nextLessonId = ordered.find((lesson) => !completedLessonIds.includes(lesson.id))?.id ?? null;
  } else {
    nextLessonId = ordered.find((lesson) => !completedLessonIds.includes(lesson.id))?.id ?? null;
  }

  return {
    percent,
    completedLessonIds,
    completedAt,
    nextLessonId,
    nextLessonHref: nextLessonId ? choirAcademyLessonHref(groupId, course.id, nextLessonId) : null,
  };
}

function toCourseCard(
  groupId: string,
  course: ChoirAcademyCourse,
  lessons: ChoirAcademyLesson[],
  progress: ChoirAcademyLessonProgress[],
): ChoirAcademyCourseCardView {
  const path = choirAcademyPathById(course.pathId);
  return {
    id: course.id,
    pathId: course.pathId,
    pathTitle: path?.title ?? course.pathId,
    title: course.title,
    description: course.description,
    coverImagePath: course.coverImagePath?.trim() || CHOIR_HERO_IMAGE_PATH,
    instructorName: course.instructorName,
    lessonCount: lessonsForCourse(lessons, course.id).length,
    estimatedMinutes: course.estimatedMinutes,
    difficulty: course.difficulty,
    progress: buildProgressView(groupId, course, lessons, progress),
    href: choirAcademyCourseHref(groupId, course.id),
  };
}

async function loadCatalog(groupId: string, userId: string, includeDrafts: boolean) {
  const [courses, lessons, progress] = await Promise.all([
    listChoirAcademyCoursesJson(groupId),
    listChoirAcademyLessonsJson(groupId),
    listChoirAcademyProgressForUserJson(userId),
  ]);
  const visible = includeDrafts ? courses : courses.filter((course) => course.status === "published");
  return { courses: visible, lessons, progress };
}

async function buildReadinessView(user: PublicMember, groupId: string): Promise<ChoirAcademyReadinessView> {
  const pack = await getReadinessStatusForGroup(user.id, groupId);
  const groupHref = `/groups/${encodeURIComponent(groupId)}`;
  if (!pack) {
    return {
      title: "Ministry Readiness — Before You Serve",
      statusLabel: "Completed",
      detail: "Your Before You Serve training is on file for Shanah Worship.",
      actionLabel: "View worship home",
      actionHref: groupHref,
      completed: true,
      pack: null,
    };
  }

  if (pack.completed) {
    const approval = pack.requiresLeaderApproval ? " Leader approval may still be required." : "";
    return {
      title: "Ministry Readiness — Before You Serve",
      statusLabel: pack.requiresLeaderApproval ? "Approval pending" : "Completed",
      detail: `You completed Before You Serve training.${approval}`,
      actionLabel: "View worship home",
      actionHref: groupHref,
      completed: true,
      pack,
    };
  }

  const required = pack.requiredForSelfJoin || pack.requiredForRetraining;
  return {
    title: "Ministry Readiness — Before You Serve",
    statusLabel: required ? "Required" : "In progress",
    detail: pack.subtitle,
    actionLabel: "Continue Before You Serve",
    actionHref: `${groupHref}?training=1`,
    completed: false,
    pack,
  };
}

function computeOverviewStats(
  paths: { publishedCourseCount: number }[],
  courseCards: ChoirAcademyCourseCardView[],
  progress: ChoirAcademyLessonProgress[],
) {
  const publishedCourseCount = courseCards.length;
  const coursesInProgress = courseCards.filter(
    (course) => course.progress.percent > 0 && course.progress.percent < 100,
  ).length;
  const completedCourses = courseCards.filter((course) => course.progress.percent === 100 && course.lessonCount > 0)
    .length;
  const lessonsCompleted = progress.length;
  const totalLessonSlots = courseCards.reduce((sum, course) => sum + course.lessonCount, 0);
  const overallProgressPercent =
    totalLessonSlots === 0 ? 0 : Math.round((lessonsCompleted / totalLessonSlots) * 100);

  return {
    learningPathCount: paths.filter((path) => path.publishedCourseCount > 0).length,
    coursesInProgress,
    lessonsCompleted,
    overallProgressPercent: Math.min(100, overallProgressPercent),
    completedCourses,
  };
}

export async function buildChoirAcademyHomePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirAcademyHomePayload | null> {
  const group = await assertChoirAcademyAccess(user, groupId);
  if (!group) return null;

  const canManage = await canManageChoirAcademy(user, groupId);
  const { courses, lessons, progress } = await loadCatalog(groupId, user.id, canManage);
  const published = courses.filter((course) => course.status === "published");
  const courseCards = published.map((course) => toCourseCard(groupId, course, lessons, progress));

  const paths = CHOIR_ACADEMY_PATHS.map((path) => {
    const count = published.filter((course) => course.pathId === path.id).length;
    return {
      id: path.id,
      title: path.title,
      description: path.description,
      icon: path.icon,
      publishedCourseCount: count,
      href: choirAcademyPathHref(groupId, path.id),
    };
  });

  const continueCandidates = courseCards
    .filter((course) => course.lessonCount > 0 && course.progress.percent > 0 && course.progress.percent < 100)
    .sort((a, b) => b.progress.percent - a.progress.percent);
  const continueCourse = continueCandidates[0] ?? null;

  const readiness = await buildReadinessView(user, groupId);

  return {
    groupId,
    groupChatHref: groupChatHref(groupId),
    stats: computeOverviewStats(paths, courseCards, progress),
    paths,
    continueCourse,
    readiness,
    canManageAcademy: canManage,
    manageHref: choirAcademyManageHref(groupId),
  };
}

export async function buildChoirAcademyPathPayload(
  user: PublicMember,
  groupId: string,
  pathId: string,
): Promise<ChoirAcademyPathPayload | null> {
  const group = await assertChoirAcademyAccess(user, groupId);
  if (!group) return null;
  const path = choirAcademyPathById(pathId);
  if (!path) return null;

  const canManage = await canManageChoirAcademy(user, groupId);
  const { courses, lessons, progress } = await loadCatalog(groupId, user.id, canManage);
  const published = courses.filter((course) => course.status === "published" && course.pathId === path.id);
  const pathCard = {
    id: path.id,
    title: path.title,
    description: path.description,
    icon: path.icon,
    publishedCourseCount: published.length,
    href: choirAcademyPathHref(groupId, path.id),
  };

  return {
    groupId,
    path: pathCard,
    courses: published.map((course) => toCourseCard(groupId, course, lessons, progress)),
  };
}

export async function buildChoirAcademyCoursesPayload(user: PublicMember, groupId: string) {
  const home = await buildChoirAcademyHomePayload(user, groupId);
  if (!home) return null;
  const canManage = await canManageChoirAcademy(user, groupId);
  const { courses, lessons, progress } = await loadCatalog(groupId, user.id, canManage);
  const published = courses.filter((course) => course.status === "published");
  return {
    groupId,
    groupChatHref: home.groupChatHref,
    courses: published.map((course) => toCourseCard(groupId, course, lessons, progress)),
    canManageAcademy: canManage,
    manageHref: home.manageHref,
  };
}

export async function buildChoirAcademyCourseDetailPayload(
  user: PublicMember,
  groupId: string,
  courseId: string,
): Promise<ChoirAcademyCourseDetailPayload | null> {
  const group = await assertChoirAcademyAccess(user, groupId);
  if (!group) return null;
  const canManage = await canManageChoirAcademy(user, groupId);
  const { courses, lessons, progress } = await loadCatalog(groupId, user.id, canManage);
  const course = courses.find((row) => row.id === courseId);
  if (!course || (!canManage && course.status !== "published")) return null;

  const ordered = lessonsForCourse(lessons, course.id);
  const progressView = buildProgressView(groupId, course, lessons, progress);
  const card = toCourseCard(groupId, course, lessons, progress);

  const lessonRows: ChoirAcademyLessonRowView[] = ordered.map((lesson, index) => {
    const completed = progressView.completedLessonIds.includes(lesson.id);
    let locked = false;
    if (course.sequentialLessons && !completed) {
      const firstIncomplete = ordered.find((row) => !progressView.completedLessonIds.includes(row.id));
      locked = firstIncomplete?.id !== lesson.id;
    }
    return {
      id: lesson.id,
      number: index + 1,
      title: lesson.title,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes,
      completed,
      locked,
      href: locked ? card.href : choirAcademyLessonHref(groupId, course.id, lesson.id),
    };
  });

  return {
    groupId,
    canManageAcademy: canManage,
    course: {
      ...card,
      learningObjectives: course.learningObjectives ?? [],
      sequentialLessons: course.sequentialLessons,
    },
    lessons: lessonRows,
  };
}

export async function buildChoirAcademyLessonPayload(
  user: PublicMember,
  groupId: string,
  courseId: string,
  lessonId: string,
): Promise<ChoirAcademyLessonPayload | null> {
  const detail = await buildChoirAcademyCourseDetailPayload(user, groupId, courseId);
  if (!detail) return null;
  const canManage = await canManageChoirAcademy(user, groupId);
  const lessons = await listChoirAcademyLessonsJson(groupId);
  const lesson = lessons.find((row) => row.id === lessonId && row.courseId === courseId);
  if (!lesson) return null;

  const row = detail.lessons.find((item) => item.id === lessonId);
  if (row?.locked && !canManage) return null;

  const orderedIds = detail.lessons.map((item) => item.id);
  const index = orderedIds.indexOf(lessonId);
  const previousLessonId = index > 0 ? orderedIds[index - 1] : null;
  const nextLessonId = index >= 0 && index < orderedIds.length - 1 ? orderedIds[index + 1] : null;

  return {
    groupId,
    courseId,
    lesson,
    courseTitle: detail.course.title,
    progress: detail.course.progress,
    previousLessonId,
    nextLessonId,
    previousHref: previousLessonId
      ? choirAcademyLessonHref(groupId, courseId, previousLessonId)
      : null,
    nextHref: nextLessonId ? choirAcademyLessonHref(groupId, courseId, nextLessonId) : null,
    courseHref: choirAcademyCourseHref(groupId, courseId),
  };
}

export async function buildChoirAcademyMyLearningPayload(user: PublicMember, groupId: string) {
  const group = await assertChoirAcademyAccess(user, groupId);
  if (!group) return null;
  const canManage = await canManageChoirAcademy(user, groupId);
  const { courses, lessons, progress } = await loadCatalog(groupId, user.id, canManage);
  const published = courses.filter((course) => course.status === "published");
  const cards = published.map((course) => toCourseCard(groupId, course, lessons, progress));
  const assignments = await listChoirAcademyAssignmentsForUserJson(user.id, groupId);

  return {
    groupId,
    groupChatHref: groupChatHref(groupId),
    inProgress: cards.filter((course) => course.progress.percent > 0 && course.progress.percent < 100),
    completed: cards.filter((course) => course.progress.percent === 100 && course.lessonCount > 0),
    assigned: assignments
      .map((assignment) => {
        const course = cards.find((row) => row.id === assignment.courseId);
        if (!course) return null;
        return {
          assignmentId: assignment.id,
          assignedAt: assignment.assignedAt,
          dueDate: assignment.dueDate,
          course,
        };
      })
      .filter(Boolean),
  };
}

export async function buildChoirAcademyAchievementsPayload(user: PublicMember, groupId: string) {
  const group = await assertChoirAcademyAccess(user, groupId);
  if (!group) return null;
  const canManage = await canManageChoirAcademy(user, groupId);
  const { courses, lessons, progress } = await loadCatalog(groupId, user.id, canManage);
  const published = courses.filter((course) => course.status === "published");
  const cards = published.map((course) => toCourseCard(groupId, course, lessons, progress));
  const completed = cards.filter((course) => course.progress.percent === 100 && course.lessonCount > 0);

  const achievements: ChoirAcademyAchievementView[] = completed.map((course) => ({
    id: `course-${course.id}`,
    title: `${course.title} completed`,
    description: `Finished all lessons in ${course.pathTitle}.`,
    earnedAt: course.progress.completedAt,
    earned: true,
  }));

  const pathCompletions = CHOIR_ACADEMY_PATHS.map((path) => {
    const pathCourses = cards.filter((course) => course.pathId === path.id && course.lessonCount > 0);
    if (pathCourses.length === 0) return null;
    const allDone = pathCourses.every((course) => course.progress.percent === 100);
    if (!allDone) return null;
    const earnedAt = pathCourses
      .map((course) => course.progress.completedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return {
      id: `path-${path.id}`,
      title: `${path.title} path completed`,
      description: `Completed every published course in ${path.title}.`,
      earnedAt,
      earned: true,
    } satisfies ChoirAcademyAchievementView;
  }).filter(Boolean) as ChoirAcademyAchievementView[];

  return {
    groupId,
    groupChatHref: groupChatHref(groupId),
    achievements: [...pathCompletions, ...achievements],
    achievementsHref: choirAcademyAchievementsHref(groupId),
    homeHref: choirAcademyHomeHref(groupId),
  };
}

function normalizeYoutubeId(input?: string) {
  if (!input?.trim()) return undefined;
  return parseYouTubeVideoId(input.trim()) ?? undefined;
}

export async function handleChoirAcademyAction(user: PublicMember, body: Record<string, unknown>) {
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID).trim();
  const action = String(body.action ?? "").trim();
  const group = await assertChoirAcademyAccess(user, groupId);
  if (!group) {
    throw new Error("Access denied.");
  }

  if (action === "mark_lesson_complete") {
    const courseId = String(body.courseId ?? "").trim();
    const lessonId = String(body.lessonId ?? "").trim();
    if (!courseId || !lessonId) throw new Error("Course and lesson are required.");
    const detail = await buildChoirAcademyCourseDetailPayload(user, groupId, courseId);
    if (!detail) throw new Error("Course not found.");
    const lesson = detail.lessons.find((row) => row.id === lessonId);
    if (!lesson || lesson.locked) throw new Error("Lesson is not available.");
    const record = await markChoirAcademyLessonCompleteJson({
      userId: user.id,
      courseId,
      lessonId,
      quizScorePercent: typeof body.quizScorePercent === "number" ? body.quizScorePercent : undefined,
    });
    return { progress: record };
  }

  if (action === "submit_quiz") {
    const courseId = String(body.courseId ?? "").trim();
    const lessonId = String(body.lessonId ?? "").trim();
    const answers = body.answers as Record<string, number | string> | undefined;
    const lessons = await listChoirAcademyLessonsJson(groupId);
    const lesson = lessons.find((row) => row.id === lessonId && row.courseId === courseId);
    if (!lesson?.quiz) throw new Error("Quiz not found.");
    const result = scoreQuiz(lesson.quiz, answers ?? {});
    if (lesson.quiz.passingPercent != null && result.percent < lesson.quiz.passingPercent) {
      return { passed: false, ...result };
    }
    await markChoirAcademyLessonCompleteJson({
      userId: user.id,
      courseId,
      lessonId,
      quizScorePercent: result.percent,
    });
    return { passed: true, ...result };
  }

  const canManage = await canManageChoirAcademy(user, groupId);
  if (!canManage) {
    throw new Error("Not authorized to manage academy content.");
  }

  if (action === "upsert_course") {
    const now = new Date().toISOString();
    const id = String(body.id ?? "").trim() || `course-${Date.now()}`;
    const pathId = String(body.pathId ?? "") as ChoirAcademyPathId;
    if (!choirAcademyPathById(pathId)) throw new Error("Invalid learning path.");
    const existing = (await listChoirAcademyCoursesJson(groupId)).find((row) => row.id === id);
    const course: ChoirAcademyCourse = {
      id,
      groupId,
      pathId,
      title: String(body.title ?? "").trim() || "Untitled course",
      description: String(body.description ?? "").trim(),
      coverImagePath: String(body.coverImagePath ?? "").trim() || undefined,
      instructorName: String(body.instructorName ?? "").trim() || undefined,
      learningObjectives: Array.isArray(body.learningObjectives)
        ? body.learningObjectives.map((item) => String(item).trim()).filter(Boolean)
        : [],
      estimatedMinutes: typeof body.estimatedMinutes === "number" ? body.estimatedMinutes : undefined,
      difficulty:
        body.difficulty === "beginner" || body.difficulty === "intermediate" || body.difficulty === "advanced"
          ? body.difficulty
          : undefined,
      status: body.status === "published" ? "published" : "draft",
      sequentialLessons: body.sequentialLessons !== false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await upsertChoirAcademyCourseJson(course);
    return { course };
  }

  if (action === "upsert_lesson") {
    const now = new Date().toISOString();
    const courseId = String(body.courseId ?? "").trim();
    const courses = await listChoirAcademyCoursesJson(groupId);
    const course = courses.find((row) => row.id === courseId);
    if (!course) throw new Error("Course not found.");
    const id = String(body.id ?? "").trim() || `lesson-${Date.now()}`;
    const lessons = lessonsForCourse(await listChoirAcademyLessonsJson(groupId), courseId);
    const existing = lessons.find((row) => row.id === id);
    const type = String(body.type ?? "article") as ChoirAcademyLesson["type"];
    const mediaUrl = String(body.mediaUrl ?? "").trim() || undefined;
    const lesson: ChoirAcademyLesson = {
      id,
      groupId,
      courseId,
      title: String(body.title ?? "").trim() || "Untitled lesson",
      type,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : lessons.length,
      durationMinutes: typeof body.durationMinutes === "number" ? body.durationMinutes : undefined,
      bodyMarkdown: String(body.bodyMarkdown ?? "").trim() || undefined,
      mediaUrl,
      youtubeVideoId: normalizeYoutubeId(String(body.youtubeVideoId ?? mediaUrl ?? "")),
      documentPath: String(body.documentPath ?? "").trim() || undefined,
      quiz: body.quiz as ChoirAcademyQuiz | undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await upsertChoirAcademyLessonJson(lesson);
    return { lesson };
  }

  if (action === "delete_lesson") {
    const lessonId = String(body.lessonId ?? "").trim();
    const ok = await deleteChoirAcademyLessonJson(groupId, lessonId);
    if (!ok) throw new Error("Lesson not found.");
    return { ok: true };
  }

  if (action === "assign_course") {
    const courseId = String(body.courseId ?? "").trim();
    const userId = String(body.userId ?? "").trim();
    if (!courseId || !userId) throw new Error("Course and member are required.");
    const assignment = await createChoirAcademyAssignmentJson({
      groupId,
      courseId,
      userId,
      assignedByUserId: user.id,
      dueDate: String(body.dueDate ?? "").trim() || undefined,
    });
    return { assignment };
  }

  throw new Error("Unknown action.");
}

function scoreQuiz(quiz: ChoirAcademyQuiz, answers: Record<string, number | string>) {
  const gradable = quiz.questions.filter((question) => question.type !== "reflection");
  if (gradable.length === 0) {
    return { percent: 100, correct: 0, total: 0 };
  }
  let correct = 0;
  for (const question of gradable) {
    const answer = answers[question.id];
    if (question.type === "true_false" || question.type === "choice") {
      if (typeof answer === "number" && answer === question.correctIndex) {
        correct += 1;
      }
    }
  }
  const percent = Math.round((correct / gradable.length) * 100);
  return { percent, correct, total: gradable.length };
}
