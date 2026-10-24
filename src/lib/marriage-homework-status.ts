import type {
  MarriageHomeworkActivityDef,
  MarriageHomeworkParticipantStatus,
  MarriageSessionHomeworkRecord,
  MarriageSessionHomeworkResponseRecord,
} from "@/lib/marriage-homework-types";
import { homeworkAnswerKey } from "@/lib/marriage-homework-types";

function writableQuestionKeys(activities: MarriageHomeworkActivityDef[]): string[] {
  const keys: string[] = [];
  for (const activity of activities) {
    if (activity.kind === "curriculum_link") continue;
    for (const q of activity.questions) {
      keys.push(homeworkAnswerKey(activity.id, q.id));
    }
  }
  return keys;
}

export function countAnsweredQuestions(
  activities: MarriageHomeworkActivityDef[],
  answers: Record<string, string>,
): number {
  const keys = writableQuestionKeys(activities);
  return keys.filter((k) => (answers[k] ?? "").trim().length > 0).length;
}

export function totalWritableQuestions(activities: MarriageHomeworkActivityDef[]): number {
  return writableQuestionKeys(activities).length;
}

export function participantHomeworkStatus(input: {
  homework: MarriageSessionHomeworkRecord;
  response: MarriageSessionHomeworkResponseRecord | null;
  nowMs?: number;
}): MarriageHomeworkParticipantStatus {
  const { homework, response } = input;
  const nowMs = input.nowMs ?? Date.now();
  if (response?.submittedAt) return "submitted";
  const answered = countAnsweredQuestions(homework.activities, response?.answers ?? {});
  const status: MarriageHomeworkParticipantStatus =
    answered <= 0 ? "not_started" : "in_progress";
  if (
    homework.status === "released" &&
    homework.dueAt &&
    !response?.submittedAt &&
    new Date(homework.dueAt).getTime() < nowMs
  ) {
    return "overdue";
  }
  return status;
}

export function homeworkIsCompleteForSubmit(
  activities: MarriageHomeworkActivityDef[],
  answers: Record<string, string>,
): boolean {
  const keys = writableQuestionKeys(activities);
  return keys.every((k) => (answers[k] ?? "").trim().length > 0);
}
