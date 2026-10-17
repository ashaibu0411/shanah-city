import type {
  MarriageComparisonItem,
  MarriageDiscussionMarkRecord,
} from "@/lib/marriage-counseling-types";

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

  if (!forQuestion.length) {
    return { discussed: false, sharedNotes: [] };
  }

  const primary = forQuestion.reduce((latest, m) =>
    m.markedAt.localeCompare(latest.markedAt) >= 0 ? m : latest,
  );

  const sharedNotes = forQuestion
    .filter((m) => m.sharedNote && m.sharedNote.trim())
    .map((m) => ({
      authorUserId: m.markedByUserId,
      body: m.sharedNote!.trim(),
      markedAt: m.markedAt,
    }));

  return {
    discussed: true,
    markedByUserId: primary.markedByUserId,
    markedAt: primary.markedAt,
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
