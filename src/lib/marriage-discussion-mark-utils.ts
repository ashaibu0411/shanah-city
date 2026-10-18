import type { MarriageDiscussionMarkRecord } from "@/lib/marriage-counseling-types";

export function markHasSharedNote(mark: MarriageDiscussionMarkRecord): boolean {
  return Boolean(mark.sharedNote?.trim());
}

/** Whether this row contributes to the couple-level "Discussed" status. */
export function markCountsAsDiscussed(mark: MarriageDiscussionMarkRecord): boolean {
  if (mark.discussedAt === null) return false;
  if (mark.discussedAt) return true;
  return true;
}

export function questionIsDiscussed(marks: MarriageDiscussionMarkRecord[], questionId: string): boolean {
  return marks.filter((m) => m.questionId === questionId).some(markCountsAsDiscussed);
}
