import type {
  MarriageHomeworkCounselorReviewStatus,
  MarriageSessionHomeworkRecord,
  MarriageSessionHomeworkResponseRecord,
} from "@/lib/marriage-homework-types";

export function normalizeHomeworkReviewStatus(
  value: string | null | undefined,
): MarriageHomeworkCounselorReviewStatus {
  const raw = String(value ?? "assigned").toLowerCase();
  if (raw === "submitted") return "submitted";
  if (raw === "revision_requested") return "revision_requested";
  if (raw === "resubmitted") return "resubmitted";
  if (raw === "approved") return "approved";
  return "assigned";
}

export function partnerMayEditHomeworkAnswers(input: {
  homework: MarriageSessionHomeworkRecord;
  response: MarriageSessionHomeworkResponseRecord | null;
}): boolean {
  const { homework, response } = input;
  if (!response?.submittedAt) return true;
  if (response.reviewStatus === "revision_requested") return true;
  if (homework.reopenedAt && response.submittedAt) {
    const reopenedMs = new Date(homework.reopenedAt).getTime();
    const submittedMs = new Date(response.submittedAt).getTime();
    if (submittedMs <= reopenedMs) return true;
  }
  return false;
}

export function homeworkSubmissionAwaitingCounselor(
  status: MarriageHomeworkCounselorReviewStatus | undefined,
): boolean {
  return status === "submitted" || status === "resubmitted";
}

export function homeworkBlocksSessionApproval(
  homework: MarriageSessionHomeworkRecord,
  responses: MarriageSessionHomeworkResponseRecord[],
  partnerAId: string,
  partnerBId: string,
): string | null {
  if (homework.status !== "released") return null;
  const respA = responses.find((r) => r.userId === partnerAId);
  const respB = responses.find((r) => r.userId === partnerBId);
  if (!respA?.submittedAt || !respB?.submittedAt) {
    return `Homework "${homework.title}" is not complete for both partners.`;
  }
  const stA = normalizeHomeworkReviewStatus(respA.reviewStatus);
  const stB = normalizeHomeworkReviewStatus(respB.reviewStatus);
  if (stA !== "approved" || stB !== "approved") {
    return `Homework "${homework.title}" must be approved before this session can be marked complete.`;
  }
  return null;
}
