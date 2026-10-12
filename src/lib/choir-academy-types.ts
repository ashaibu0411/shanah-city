import type { ChoirAcademyPathId } from "@/lib/choir-academy-paths";
import type { MinistryReadinessPublicPack } from "@/lib/ministry-readiness-types";

export type ChoirAcademyLessonType = "video" | "audio" | "article" | "document" | "link" | "quiz";

export type ChoirAcademyCourseStatus = "draft" | "published";

export type ChoirAcademyQuizQuestion = {
  id: string;
  type: "choice" | "true_false" | "reflection";
  prompt: string;
  options?: string[];
  correctIndex?: number;
};

export type ChoirAcademyQuiz = {
  passingPercent?: number;
  allowRetakes: boolean;
  questions: ChoirAcademyQuizQuestion[];
};

export type ChoirAcademyCourse = {
  id: string;
  groupId: string;
  pathId: ChoirAcademyPathId;
  title: string;
  description: string;
  coverImagePath?: string;
  instructorName?: string;
  learningObjectives: string[];
  estimatedMinutes?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  status: ChoirAcademyCourseStatus;
  sequentialLessons: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChoirAcademyLesson = {
  id: string;
  groupId: string;
  courseId: string;
  title: string;
  type: ChoirAcademyLessonType;
  sortOrder: number;
  durationMinutes?: number;
  bodyMarkdown?: string;
  mediaUrl?: string;
  youtubeVideoId?: string;
  documentPath?: string;
  quiz?: ChoirAcademyQuiz;
  createdAt: string;
  updatedAt: string;
};

export type ChoirAcademyLessonProgress = {
  userId: string;
  courseId: string;
  lessonId: string;
  completedAt: string;
  quizScorePercent?: number;
};

export type ChoirAcademyAssignment = {
  id: string;
  groupId: string;
  courseId: string;
  userId: string;
  assignedByUserId: string;
  assignedAt: string;
  dueDate?: string;
};

export type ChoirAcademyStore = {
  courses: ChoirAcademyCourse[];
  lessons: ChoirAcademyLesson[];
  progress: ChoirAcademyLessonProgress[];
  assignments: ChoirAcademyAssignment[];
};

export type ChoirAcademyCourseProgressView = {
  percent: number;
  completedLessonIds: string[];
  completedAt?: string;
  nextLessonId: string | null;
  nextLessonHref: string | null;
};

export type ChoirAcademyCourseCardView = {
  id: string;
  pathId: ChoirAcademyPathId;
  pathTitle: string;
  title: string;
  description: string;
  coverImagePath: string;
  instructorName?: string;
  lessonCount: number;
  estimatedMinutes?: number;
  difficulty?: string;
  progress: ChoirAcademyCourseProgressView;
  href: string;
};

export type ChoirAcademyPathCardView = {
  id: ChoirAcademyPathId;
  title: string;
  description: string;
  icon: string;
  publishedCourseCount: number;
  href: string;
};

export type ChoirAcademyOverviewStats = {
  learningPathCount: number;
  coursesInProgress: number;
  lessonsCompleted: number;
  overallProgressPercent: number;
  completedCourses: number;
};

export type ChoirAcademyReadinessView = {
  title: string;
  statusLabel: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
  completed: boolean;
  pack: MinistryReadinessPublicPack | null;
};

export type ChoirAcademyHomePayload = {
  groupId: string;
  groupChatHref: string;
  stats: ChoirAcademyOverviewStats;
  paths: ChoirAcademyPathCardView[];
  continueCourse: ChoirAcademyCourseCardView | null;
  readiness: ChoirAcademyReadinessView;
  canManageAcademy: boolean;
  manageHref: string;
};

export type ChoirAcademyPathPayload = {
  groupId: string;
  path: ChoirAcademyPathCardView;
  courses: ChoirAcademyCourseCardView[];
};

export type ChoirAcademyLessonRowView = {
  id: string;
  number: number;
  title: string;
  type: ChoirAcademyLessonType;
  durationMinutes?: number;
  completed: boolean;
  locked: boolean;
  href: string;
};

export type ChoirAcademyCourseDetailPayload = {
  groupId: string;
  canManageAcademy: boolean;
  course: ChoirAcademyCourseCardView & {
    learningObjectives: string[];
    sequentialLessons: boolean;
  };
  lessons: ChoirAcademyLessonRowView[];
};

export type ChoirAcademyLessonPayload = {
  groupId: string;
  courseId: string;
  lesson: ChoirAcademyLesson;
  courseTitle: string;
  progress: ChoirAcademyCourseProgressView;
  previousLessonId: string | null;
  nextLessonId: string | null;
  previousHref: string | null;
  nextHref: string | null;
  courseHref: string;
};

export type ChoirAcademyAchievementView = {
  id: string;
  title: string;
  description: string;
  earnedAt?: string;
  earned: boolean;
};
