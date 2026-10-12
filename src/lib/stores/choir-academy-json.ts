import { randomUUID } from "crypto";
import { readJsonFromData, writeJsonToData } from "@/lib/json-file-store";
import type {
  ChoirAcademyAssignment,
  ChoirAcademyCourse,
  ChoirAcademyLesson,
  ChoirAcademyLessonProgress,
  ChoirAcademyStore,
} from "@/lib/choir-academy-types";

const STORE_FILENAME = "choir-academy.json";

const EMPTY: ChoirAcademyStore = {
  courses: [],
  lessons: [],
  progress: [],
  assignments: [],
};

async function readStore(): Promise<ChoirAcademyStore> {
  const parsed = await readJsonFromData<Partial<ChoirAcademyStore>>(STORE_FILENAME, {});
  return {
    courses: Array.isArray(parsed.courses) ? parsed.courses : [],
    lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
    progress: Array.isArray(parsed.progress) ? parsed.progress : [],
    assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
  };
}

async function writeStore(store: ChoirAcademyStore) {
  await writeJsonToData(STORE_FILENAME, store);
}

export async function listChoirAcademyCoursesJson(groupId: string) {
  const store = await readStore();
  return store.courses.filter((course) => course.groupId === groupId);
}

export async function listChoirAcademyLessonsJson(groupId: string) {
  const store = await readStore();
  return store.lessons.filter((lesson) => lesson.groupId === groupId);
}

export async function listChoirAcademyProgressForUserJson(userId: string) {
  const store = await readStore();
  return store.progress.filter((row) => row.userId === userId);
}

export async function listChoirAcademyAssignmentsForUserJson(userId: string, groupId: string) {
  const store = await readStore();
  return store.assignments.filter((row) => row.userId === userId && row.groupId === groupId);
}

export async function upsertChoirAcademyCourseJson(course: ChoirAcademyCourse) {
  const store = await readStore();
  const index = store.courses.findIndex((row) => row.id === course.id);
  if (index >= 0) {
    store.courses[index] = course;
  } else {
    store.courses.push(course);
  }
  await writeStore(store);
  return course;
}

export async function upsertChoirAcademyLessonJson(lesson: ChoirAcademyLesson) {
  const store = await readStore();
  const index = store.lessons.findIndex((row) => row.id === lesson.id);
  if (index >= 0) {
    store.lessons[index] = lesson;
  } else {
    store.lessons.push(lesson);
  }
  await writeStore(store);
  return lesson;
}

export async function deleteChoirAcademyLessonJson(groupId: string, lessonId: string) {
  const store = await readStore();
  const before = store.lessons.length;
  store.lessons = store.lessons.filter((row) => !(row.groupId === groupId && row.id === lessonId));
  store.progress = store.progress.filter((row) => row.lessonId !== lessonId);
  await writeStore(store);
  return store.lessons.length < before;
}

export async function markChoirAcademyLessonCompleteJson(
  input: Omit<ChoirAcademyLessonProgress, "completedAt"> & { completedAt?: string },
) {
  const store = await readStore();
  const completedAt = input.completedAt ?? new Date().toISOString();
  const index = store.progress.findIndex(
    (row) =>
      row.userId === input.userId && row.courseId === input.courseId && row.lessonId === input.lessonId,
  );
  const record: ChoirAcademyLessonProgress = {
    userId: input.userId,
    courseId: input.courseId,
    lessonId: input.lessonId,
    completedAt,
    quizScorePercent: input.quizScorePercent,
  };
  if (index >= 0) {
    store.progress[index] = { ...store.progress[index], ...record };
  } else {
    store.progress.push(record);
  }
  await writeStore(store);
  return record;
}

export async function createChoirAcademyAssignmentJson(
  input: Omit<ChoirAcademyAssignment, "id" | "assignedAt">,
) {
  const store = await readStore();
  const record: ChoirAcademyAssignment = {
    ...input,
    id: randomUUID(),
    assignedAt: new Date().toISOString(),
  };
  store.assignments.push(record);
  await writeStore(store);
  return record;
}
