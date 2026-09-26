import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";
import { getGroups } from "@/lib/group-server";
import { sendGroupChatMessage } from "@/lib/group-chat-server";
import {
  formatGroupScheduleCalendarPreview,
  type GroupServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";
import {
  getGroupServiceScheduleConfig,
  programLabel,
} from "@/lib/group-service-schedule-config";
import { notifyGroupChatMessage, sendPushToUsersWithAnyPreference } from "@/lib/push-server";
import { resolveGroupChatNotificationRecipientIds } from "@/lib/group-chat-notifications-server";
import { serviceDateTimeLabel, type WorshipServicePlan } from "@/lib/worship-types";
import {
  formatWorshipPlanSetlistForChat,
  formatWorshipPlanSetlistForPush,
  worshipPlannerPath,
} from "@/lib/worship-plan-links";
import type { ChurchEvent } from "@/lib/types";

function choirGroupId() {
  return getConfiguredWorshipGroupId();
}

export function isChoirNotifyGroupId(groupId: string | null | undefined) {
  return Boolean(groupId && groupId === choirGroupId());
}

async function choirGroupName() {
  const groups = await getGroups();
  return groups.find((entry) => entry.id === choirGroupId())?.name ?? "Shanah Worship (Choir)";
}

function choirChatUrl() {
  return `/groups/${encodeURIComponent(choirGroupId())}?chat=1`;
}

function choirCalendarUrl() {
  return `/groups/${encodeURIComponent(choirGroupId())}?calendar=1`;
}

async function eligibleChoirMemberIds(excludeUserId?: string) {
  const groupId = choirGroupId();
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return [];
  const fromChat = await resolveGroupChatNotificationRecipientIds(groupId, excludeUserId ?? "");
  const memberSet = new Set(group.memberIds.filter((id) => id !== excludeUserId));
  for (const id of fromChat) {
    memberSet.add(id);
  }
  return [...memberSet];
}

export async function pushNotifyChoirMembers(input: {
  title: string;
  body: string;
  /** Where the push opens — group chat when we also posted a message there. */
  url: string;
  excludeUserId?: string;
}) {
  const userIds = await eligibleChoirMemberIds(input.excludeUserId);
  if (userIds.length === 0) {
    return { sent: 0, failed: 0, configured: true };
  }

  return sendPushToUsersWithAnyPreference(
    userIds,
    {
      title: input.title,
      body: input.body,
      url: input.url,
    },
    ["worship", "groupChat"],
  );
}

async function broadcastChoirUpdate(input: {
  actor: { id: string; name: string };
  pushTitle: string;
  pushBody: string;
  chatBody: string;
  pushUrl?: string;
}) {
  const chatMessage = `${input.chatBody.trim()}\n\n💬 This update is in Shanah Worship group chat so nothing is missed.`;

  const chat = await postChoirGroupChatAnnouncement({
    senderId: input.actor.id,
    senderName: input.actor.name,
    content: chatMessage,
  });

  const push = await pushNotifyChoirMembers({
    title: input.pushTitle,
    body: input.pushBody,
    url: input.pushUrl ?? choirChatUrl(),
    excludeUserId: input.actor.id,
  });

  return { push, chat };
}

export async function postChoirGroupChatAnnouncement(input: {
  senderId: string;
  senderName: string;
  content: string;
}) {
  const groupId = choirGroupId();
  const groupName = await choirGroupName();
  const text = input.content.trim();
  if (!text) return null;

  const message = await sendGroupChatMessage({
    groupId,
    groupName,
    senderId: input.senderId,
    senderName: input.senderName,
    content: text,
  });

  await notifyGroupChatMessage({
    groupId,
    groupName,
    senderId: input.senderId,
    senderName: input.senderName,
    preview: text.slice(0, 120),
  });

  return message;
}

export async function notifyChoirServiceScheduleSaved(input: {
  entry: GroupServiceScheduleEntry;
  actor: { id: string; name: string };
  isUpdate: boolean;
}) {
  if (!isChoirNotifyGroupId(input.entry.groupId)) {
    return { push: null, chat: null };
  }

  const config = getGroupServiceScheduleConfig(input.entry.groupId);
  if (!config) {
    return { push: null, chat: null };
  }

  const program = programLabel(config, input.entry.program);
  const when = serviceDateTimeLabel(input.entry.serviceDate, input.entry.serviceTime);
  const preview = formatGroupScheduleCalendarPreview(input.entry, config);

  return broadcastChoirUpdate({
    actor: input.actor,
    pushTitle: input.isUpdate ? "Choir schedule updated" : "New choir schedule",
    pushBody: `${program} · ${when}`,
    chatBody: `${input.isUpdate ? "✏️ Schedule updated" : "📅 New schedule"} — ${program} · ${when}\n${preview}`,
    pushUrl: choirCalendarUrl(),
  });
}

export async function notifyChoirServiceScheduleRemoved(input: {
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  program: string;
  actor: { id: string; name: string };
}) {
  if (!isChoirNotifyGroupId(input.groupId)) {
    return { push: null, chat: null };
  }

  const config = getGroupServiceScheduleConfig(input.groupId);
  const program = config ? programLabel(config, input.program) : input.program;
  const when = serviceDateTimeLabel(input.serviceDate, input.serviceTime);

  return broadcastChoirUpdate({
    actor: input.actor,
    pushTitle: "Choir schedule removed",
    pushBody: `${program} · ${when}`,
    chatBody: `🗑️ Removed from choir calendar: ${program} · ${when}`,
    pushUrl: choirCalendarUrl(),
  });
}

export async function notifyChoirWorshipPlanPublished(
  plan: WorshipServicePlan,
  actor: { id: string; name: string },
) {
  return broadcastChoirUpdate({
    actor,
    pushTitle: "Worship plan published",
    pushBody: formatWorshipPlanSetlistForPush(plan),
    chatBody: formatWorshipPlanSetlistForChat(plan),
    pushUrl: worshipPlannerPath(plan),
  });
}

export async function notifyChoirWorshipRotationPublished(input: {
  body: string;
  actor: { id: string; name: string };
}) {
  return broadcastChoirUpdate({
    actor: input.actor,
    pushTitle: "Worship leader schedule published",
    pushBody: input.body,
    chatBody: `📋 Worship leader schedule published\n${input.body}`,
    pushUrl: "/worship?tab=schedule",
  });
}

export async function notifyChoirManualCalendarEvent(input: {
  event: ChurchEvent;
  actor: { id: string; name: string };
  isUpdate: boolean;
}) {
  if (!isChoirNotifyGroupId(input.event.groupId)) {
    return { push: null, chat: null };
  }

  return broadcastChoirUpdate({
    actor: input.actor,
    pushTitle: input.isUpdate ? "Choir calendar updated" : "New on choir calendar",
    pushBody: `${input.event.title} · ${input.event.date} ${input.event.time}`.trim(),
    chatBody: `${input.isUpdate ? "✏️ Calendar updated" : "📌 New calendar item"}: ${input.event.title} · ${input.event.date} · ${input.event.time}`,
    pushUrl: `${choirCalendarUrl()}&event=${encodeURIComponent(input.event.id)}`,
  });
}

export async function notifyChoirUnavailabilityApproved(input: {
  personName: string;
  startDate: string;
  endDate: string;
  reason: string;
  actor: { id: string; name: string };
}) {
  return broadcastChoirUpdate({
    actor: input.actor,
    pushTitle: "Choir availability updated",
    pushBody: `${input.personName} away ${input.startDate} – ${input.endDate}`,
    chatBody: `🕊️ Approved time away: ${input.personName} (${input.startDate} – ${input.endDate})${input.reason ? ` — ${input.reason}` : ""}`,
    pushUrl: choirCalendarUrl(),
  });
}
