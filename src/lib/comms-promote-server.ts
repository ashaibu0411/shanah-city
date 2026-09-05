import type { PublicMember } from "@/lib/auth-types";
import { commsChannelMeta } from "@/lib/comms-constants";
import {
  getCommsCalendarItemById,
  saveCommsCalendarItem,
  saveCommsRequest,
} from "@/lib/comms-server";
import type { CommsCalendarItem, CommsPromotedAs } from "@/lib/comms-types";
import { addCommunityPost } from "@/lib/member-server";
import { notifyCommunityPost, sendPushToAllMembers } from "@/lib/push-server";
import { saveUrgentAlert } from "@/lib/urgent-alert-server";

export type PromoteTargets = {
  homeBanner?: boolean;
  community?: boolean;
  push?: boolean;
};

export async function promoteCommsCalendarItem(
  itemId: string,
  user: Pick<PublicMember, "id" | "name">,
  targets: PromoteTargets,
) {
  const item = await getCommsCalendarItemById(itemId);
  if (!item) {
    throw new Error("Calendar item not found.");
  }

  const body = item.body?.trim() || item.title.trim();
  if (!body) {
    throw new Error("Add a message body before promoting to the app.");
  }

  const promotedAs: CommsPromotedAs = { ...(item.promotedAs ?? {}) };

  if (targets.homeBanner) {
    const alert = await saveUrgentAlert({
      title: item.title.trim(),
      message: body,
      href: "/community",
      ctaLabel: "Open community",
      active: true,
      createdBy: user.id,
      createdByName: user.name,
    });
    promotedAs.urgentAlertId = alert.id;
  }

  if (targets.community) {
    const now = new Date().toISOString();
    const post = await addCommunityPost({
      id: `announcement-${Date.now()}`,
      author: user.name,
      authorId: user.id,
      campusId: "all",
      type: "announcement",
      content: body,
      timeAgo: "Just now",
      reactions: 0,
      createdAt: now,
      comments: [],
    });
    promotedAs.communityPostId = post.id;
    await notifyCommunityPost({
      authorId: user.id,
      authorName: user.name,
      content: body,
      type: "announcement",
    });
  }

  if (targets.push) {
    await sendPushToAllMembers(
      {
        title: item.title.trim(),
        body: body.slice(0, 180),
        url: "/community",
      },
      "announcements",
      user.id,
    );
    promotedAs.pushSentAt = new Date().toISOString();
  }

  const updated = await saveCommsCalendarItem({
    ...item,
    status: "published",
    promotedAs,
  });

  return { item: updated, promotedAs };
}

export async function addApprovedRequestToCalendar(
  requestId: string,
  user: Pick<PublicMember, "id" | "name">,
  channel: CommsCalendarItem["channel"],
  weekStart: string,
  scheduledDate?: string,
) {
  const { getCommsRequestById } = await import("@/lib/comms-server");
  const request = await getCommsRequestById(requestId);
  if (!request) {
    throw new Error("Request not found.");
  }

  const meta = commsChannelMeta(channel);
  const item = await saveCommsCalendarItem({
    title: request.title,
    channel,
    weekStart,
    scheduledDate,
    status: scheduledDate ? "scheduled" : "planned",
    color: meta.color,
    body: request.description,
    requestId: request.id,
    assigneeId: request.assigneeId,
    assigneeName: request.assigneeName,
    dueDate: request.dueDate,
    createdBy: user.id,
    createdByName: user.name,
  });

  await saveCommsRequest({
    ...request,
    status: "in_progress",
    calendarItemId: item.id,
  });

  return item;
}
