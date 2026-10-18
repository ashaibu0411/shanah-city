import type {
  MarriageComparisonItem,
  MarriageDiscussionMarkRecord,
} from "@/lib/marriage-counseling-types";
import { markCountsAsDiscussed, markHasSharedNote } from "@/lib/marriage-discussion-mark-utils";

export type MarriageComparisonDiscussionView = {
  discussed: boolean;
  markedByUserId?: string;
  markedAt?: string;
  sharedNotes: Array<{
    authorUserId: string;
    body: string;
    markedAt: string;
  }>;
};

/** Either partner's mark means the couple has discussed this comparison topic. */
export function deriveSharedDiscussion(
  marks: MarriageDiscussionMarkRecord[],
  questionId: string,
): MarriageComparisonDiscussionView {
  const forQuestion = marks
    .filter((m) => m.questionId === questionId)
    .sort((a, b) => a.markedAt.localeCompare(b.markedAt));

  const sharedNotes = forQuestion
    .filter((m) => markHasSharedNote(m))
    .map((m) => ({
      authorUserId: m.markedByUserId,
      body: m.sharedNote!.trim(),
      markedAt: m.markedAt,
    }));

  const discussedMarks = forQuestion.filter((m) => markCountsAsDiscussed(m));
  if (!discussedMarks.length) {
    return { discussed: false, sharedNotes };
  }

  const primary = discussedMarks.reduce((latest, m) => {
    const latestAt = latest.discussedAt ?? latest.markedAt;
    const at = m.discussedAt ?? m.markedAt;
    return at.localeCompare(latestAt) >= 0 ? m : latest;
  });

  return {
    discussed: true,
    markedByUserId: primary.markedByUserId,
    markedAt: primary.discussedAt ?? primary.markedAt,
    sharedNotes,
  };
}

export function attachDiscussionToComparisonItems(
  items: MarriageComparisonItem[],
  marks: MarriageDiscussionMarkRecord[],
): MarriageComparisonItem[] {
  return items.map((item) => ({
    ...item,
    discussion: deriveSharedDiscussion(marks, item.questionId),
  }));
}
