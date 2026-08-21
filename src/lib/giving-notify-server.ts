import { getUserByEmail, getUserById } from "@/lib/auth-server";
import { ADMIN_GROUP_ID } from "@/lib/church-groups";
import { fundLabel, type GivingRecord } from "@/lib/giving-types";
import { getGroups } from "@/lib/group-server";
import { sendDirectMessage } from "@/lib/message-server";
import { notifyNewMessage } from "@/lib/push-server";

const CHURCH_SENDER_NAME = "Shanah City";

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

function thankYouMessage(record: GivingRecord) {
  const amount = record.amount.toLocaleString(undefined, {
    style: "currency",
    currency: record.currency || "USD",
  });
  return `Thank you for your generous gift of ${amount} to ${fundLabel(record.fund)}. We are grateful for your support and partnership in ministry!`;
}

export async function sendGivingThankYou(
  record: GivingRecord,
  notifier?: { id: string },
) {
  if (!record.userId) {
    return { sent: false as const, reason: "no_member" as const };
  }

  const recipient = await getUserById(record.userId);
  if (!recipient) {
    return { sent: false as const, reason: "member_not_found" as const };
  }

  const sender = await resolveNotifier(notifier);
  if (!sender) {
    return { sent: false as const, reason: "no_notifier" as const };
  }

  const content = thankYouMessage(record);

  try {
    const result = await sendDirectMessage({
      senderId: sender.id,
      senderName: sender.name,
      recipientId: recipient.id,
      recipientName: recipient.name,
      content,
    });

    await notifyNewMessage({
      recipientId: recipient.id,
      senderName: sender.name,
      preview: content,
      threadId: result.thread.id,
    });

    return { sent: true as const, threadId: result.thread.id };
  } catch (error) {
    console.error("Giving thank-you failed:", error);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
