import { resolveJourneyPartnerId } from "@/lib/marriage-counseling-participants";
import type { MarriageCounselingJourneyRecord } from "@/lib/marriage-counseling-types";
import type { MarriageSessionHomeworkRecord } from "@/lib/marriage-homework-types";

/** Homework that includes joint discussion requires both partners on the journey. */
export function homeworkRequiresJoinedPartner(homework: MarriageSessionHomeworkRecord): boolean {
  return homework.activities.some((activity) => activity.kind === "joint_discussion");
}

export async function journeyPartnerJoined(
  journey: MarriageCounselingJourneyRecord,
  viewerId: string,
): Promise<boolean> {
  return Boolean(await resolveJourneyPartnerId(journey, viewerId));
}

export function assertHomeworkAvailableForPartnerState(
  homework: MarriageSessionHomeworkRecord,
  partnerJoined: boolean,
): void {
  if (homeworkRequiresJoinedPartner(homework) && !partnerJoined) {
    throw new Error("This assignment is available after your partner joins the journey.");
  }
}
