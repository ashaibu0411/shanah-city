import type { PublicMember } from "@/lib/auth-types";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import type { MarriageSharingConsentRecord } from "@/lib/marriage-counseling-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

const store = () => marriageStore();

export async function setSharingConsent(
  viewer: PublicMember,
  input: { journeyId: string; moduleId: string; questionId: string; granted: boolean },
) {
  const journey = await store().getJourneyById(input.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);

  const record: MarriageSharingConsentRecord = {
    journeyId: input.journeyId,
    moduleId: input.moduleId,
    questionId: input.questionId,
    userId: viewer.id,
    granted: input.granted,
    updatedAt: new Date().toISOString(),
  };
  await store().saveSharingConsent(record);
  return record;
}

export async function listSharingConsentsForModule(
  viewer: PublicMember,
  journeyId: string,
  moduleId: string,
) {
  const journey = await store().getJourneyById(journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  const all = await store().listSharingConsents(journeyId, moduleId);
  return all.filter((c: MarriageSharingConsentRecord) => c.userId === viewer.id);
}
