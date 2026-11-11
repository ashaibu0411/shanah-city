import { sendGivingThankYou } from "@/lib/giving-notify-server";
import {
  createGivingRecord,
  deleteGivingRecord,
  getGivingRecordByAnedotDonationId,
  markThankYouSent,
} from "@/lib/giving-server";
import type { GivingFund } from "@/lib/giving-types";

function giftNotes(feeAmount: number | null | undefined, recurring: boolean) {
  const parts = ["Anedot hosted checkout."];
  if (recurring) parts.push("Recurring gift.");
  if (feeAmount !== null && feeAmount !== undefined && feeAmount > 0) {
    parts.push(`Processing fees withheld: $${feeAmount.toFixed(2)}.`);
  }
  return parts.join(" ");
}

export async function recordAnedotGift(input: {
  anedotDonationId: string;
  amount: number;
  fund: GivingFund;
  donorName: string;
  donorEmail?: string;
  userId?: string;
  givenOn: string;
  feeAmount?: number | null;
  recurring?: boolean;
  netAmount?: number | null;
}) {
  const existing = await getGivingRecordByAnedotDonationId(input.anedotDonationId);
  if (existing) return existing;

  const record = await createGivingRecord({
    userId: input.userId,
    donorName: input.donorName,
    donorEmail: input.donorEmail,
    amount: input.amount,
    currency: "USD",
    fund: input.fund,
    method: "anedot",
    givenOn: input.givenOn,
    notes: giftNotes(input.feeAmount, Boolean(input.recurring)),
    source: "anedot",
    anedotDonationId: input.anedotDonationId,
    recordedBy: input.userId ?? "anedot",
    recordedByName: "Anedot giving",
  });

  void sendGivingThankYou(record)
    .then(async (result) => {
      if (result.sent) {
        await markThankYouSent(record.id);
      }
    })
    .catch((error) => {
      console.error("Anedot giving thank-you failed:", error);
    });

  return record;
}

export async function reverseAnedotGiftByDonationId(anedotDonationId: string) {
  const existing = await getGivingRecordByAnedotDonationId(anedotDonationId);
  if (!existing) return false;
  return deleteGivingRecord(existing.id);
}
