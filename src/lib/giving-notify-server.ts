import { getUserByEmail, getUserById } from "@/lib/auth-server";
import { ADMIN_GROUP_ID } from "@/lib/church-groups";
import {
  sendGivingCustomThankYouEmail,
  sendGivingGuestReceiptEmail,
  sendGivingGuestStatementEmail,
} from "@/lib/email-server";
import { getDonorYearToDateTotal } from "@/lib/giving-server";
import {
  fundLabel,
  givingRecordsToCsv,
  methodLabel,
  summarizeGivingRecords,
  type GivingRecord,
} from "@/lib/giving-types";
import { getGroups } from "@/lib/group-server";
import { sendDirectMessage } from "@/lib/message-server";
import { notifyNewMessage } from "@/lib/push-server";

const CHURCH_SENDER_NAME = "Shanah City";

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://shanah-city.vercel.app";
}

function signUpUrl() {
  return `${appBaseUrl()}/sign-up`;
}

function donorFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim() || "Friend";
}

function formatGiftAmount(record: GivingRecord) {
  return record.amount.toLocaleString(undefined, {
    style: "currency",
    currency: record.currency || "USD",
  });
}

function formatGiftDate(givenOn: string) {
  return new Date(`${givenOn}T12:00:00`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function canDeliverThankYou(record: Pick<GivingRecord, "userId" | "donorEmail">) {
  return Boolean(record.userId || record.donorEmail);
}

export function thankYouDeliveryChannel(record: Pick<GivingRecord, "userId" | "donorEmail">) {
  if (record.userId) return "message" as const;
  if (record.donorEmail) return "email" as const;
  return null;
}

export async function buildPersonalizedThankYouMessage(record: GivingRecord) {
  const firstName = donorFirstName(record.donorName);
  const amount = formatGiftAmount(record);
  const fund = fundLabel(record.fund);
  const method = methodLabel(record.method);
  const date = formatGiftDate(record.givenOn);
  const yearToDateTotal = await getDonorYearToDateTotal(record);
  const yearToDate = yearToDateTotal.toLocaleString(undefined, {
    style: "currency",
    currency: record.currency || "USD",
  });

  let message = `Hi ${firstName},\n\nThank you for your gift of ${amount} to ${fund} through ${method} on ${date}.`;

  if (yearToDateTotal > 0) {
    message += `\n\nYour total recorded giving with Shanah City this year is ${yearToDate}.`;
  }

  message += `\n\nWe are grateful for your partnership in ministry!\n\n— Shanah City`;
  return message;
}

export async function previewGivingThankYou(record: GivingRecord) {
  const message = await buildPersonalizedThankYouMessage(record);
  return {
    message,
    canSend: canDeliverThankYou(record),
    channel: thankYouDeliveryChannel(record),
    alreadySent: Boolean(record.thankYouSentAt),
  };
}

async function resolveNotifier(input?: { id: string }) {
  if (input?.id) {
    const user = await getUserById(input.id);
    if (user) return { id: user.id, name: CHURCH_SENDER_NAME };
  }

  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (bootstrapEmail) {
    const user = await getUserByEmail(bootstrapEmail);
    if (user) return { id: user.id, name: CHURCH_SENDER_NAME };
  }

  const groups = await getGroups();
  const adminGroup = groups.find((group) => group.id === ADMIN_GROUP_ID);
  const adminId = adminGroup?.memberIds[0];
  if (adminId) {
    const user = await getUserById(adminId);
    if (user) return { id: user.id, name: CHURCH_SENDER_NAME };
  }

  return null;
}

async function sendMemberThankYou(
  record: GivingRecord,
  message: string,
  notifier?: { id: string },
) {
  const recipient = await getUserById(record.userId!);
  if (!recipient) {
    return { sent: false as const, reason: "member_not_found" as const };
  }

  const sender = await resolveNotifier(notifier);
  if (!sender) {
    return { sent: false as const, reason: "no_notifier" as const };
  }

  try {
    const result = await sendDirectMessage({
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      content: message,
    });

    await notifyNewMessage({
      recipientId: recipient.id,
      senderName: sender.name,
      preview: message,
      threadId: result.thread.id,
    });

    return { sent: true as const, channel: "message" as const, threadId: result.thread.id };
  } catch (error) {
    console.error("Giving thank-you failed:", error);
    return { sent: false as const, reason: "send_failed" as const };
  }
}

async function sendGuestThankYou(record: GivingRecord, message: string) {
  if (!record.donorEmail) {
    return { sent: false as const, reason: "no_email" as const };
  }

  const customResult = await sendGivingCustomThankYouEmail({
    to: record.donorEmail,
    name: record.donorName,
    subject: `Thank you for your gift to Shanah City, ${donorFirstName(record.donorName)}`,
    message,
  });

  if (customResult.sent) {
    return { sent: true as const, channel: "email" as const };
  }

  const fallback = await sendGivingGuestReceiptEmail({
    to: record.donorEmail,
    name: record.donorName,
    record,
    fundLabel,
    methodLabel,
    signUpUrl: signUpUrl(),
  });

  if (!fallback.sent) {
    return { sent: false as const, reason: fallback.reason };
  }

  return { sent: true as const, channel: "email" as const };
}

export async function sendGivingThankYou(
  record: GivingRecord,
  options?: {
    notifier?: { id: string };
    message?: string;
  },
) {
  if (!canDeliverThankYou(record)) {
    return { sent: false as const, reason: "no_recipient" as const };
  }

  const message =
    options?.message?.trim() || (await buildPersonalizedThankYouMessage(record));

  if (record.userId) {
    return sendMemberThankYou(record, message, options?.notifier);
  }

  return sendGuestThankYou(record, message);
}

export async function sendGuestGivingStatement(input: {
  donorEmail: string;
  donorName?: string;
  since?: string;
  until?: string;
  records: GivingRecord[];
}) {
  if (input.records.length === 0) {
    return { sent: false as const, reason: "no_records" as const };
  }

  const summary = summarizeGivingRecords(input.records);
  const csv = givingRecordsToCsv(input.records);
  const donorName =
    input.donorName?.trim() ||
    input.records[0]?.donorName ||
    input.donorEmail.split("@")[0] ||
    "Friend";

  const result = await sendGivingGuestStatementEmail({
    to: input.donorEmail,
    name: donorName,
    since: input.since,
    until: input.until,
    records: input.records,
    totalAmount: summary.totalAmount,
    fundLabel,
    methodLabel,
    signUpUrl: signUpUrl(),
    csv,
  });

  if (!result.sent) {
    return { sent: false as const, reason: result.reason };
  }

  return {
    sent: true as const,
    giftCount: input.records.length,
    totalAmount: summary.totalAmount,
  };
}
