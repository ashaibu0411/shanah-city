import type { ChoirAcademyPathId } from "@/lib/choir-academy-paths";

export function choirAcademyHomeHref(groupId: string) {
  return `/groups/${encodeURIComponent(groupId)}/academy`;
}

export function choirAcademyCoursesHref(groupId: string) {
  return `${choirAcademyHomeHref(groupId)}/courses`;
}

export function choirAcademyMyLearningHref(groupId: string) {
  return `${choirAcademyHomeHref(groupId)}/my-learning`;
}

export function choirAcademyAchievementsHref(groupId: string) {
  return `${choirAcademyHomeHref(groupId)}/achievements`;
}

export function choirAcademyManageHref(groupId: string) {
  return `${choirAcademyHomeHref(groupId)}/manage`;
}

export function choirAcademyPathHref(groupId: string, pathId: ChoirAcademyPathId | string) {
  return `${choirAcademyHomeHref(groupId)}/path/${encodeURIComponent(pathId)}`;
}

export function choirAcademyCourseHref(groupId: string, courseId: string) {
  return `${choirAcademyHomeHref(groupId)}/course/${encodeURIComponent(courseId)}`;
}

export function choirAcademyLessonHref(groupId: string, courseId: string, lessonId: string) {
  return `${choirAcademyCourseHref(groupId, courseId)}/lesson/${encodeURIComponent(lessonId)}`;
}
