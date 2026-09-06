import { commsChannelMeta } from "@/lib/comms-constants";
import type { CommsCalendarItem } from "@/lib/comms-types";
import { richTextToPlain } from "@/lib/rich-text";

export function isSocialChannel(channel: CommsCalendarItem["channel"]) {
  return channel === "facebook" || channel === "instagram";
}

export function buildSocialCaption(item: Pick<CommsCalendarItem, "title" | "body" | "channel">) {
  const meta = commsChannelMeta(item.channel);
  const body = richTextToPlain(item.body?.trim() || item.title.trim());
  return `${item.title.trim()}\n\n${body}\n\n— Shanah City · ${meta.label}`;
}
