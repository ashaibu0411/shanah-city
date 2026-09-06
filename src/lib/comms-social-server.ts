import type { PublicMember } from "@/lib/auth-types";
import { promoteCommsCalendarItemError } from "@/lib/comms-approval";
import { buildSocialCaption, isSocialChannel } from "@/lib/comms-social-utils";
import {
  getCommsCalendarItemById,
  saveCommsCalendarItem,
} from "@/lib/comms-server";
import type { CommsCalendarItem, CommsPromotedAs } from "@/lib/comms-types";

export { buildSocialCaption, isSocialChannel } from "@/lib/comms-social-utils";

async function postFacebookFeed(message: string) {
  const pageId =
    process.env.FACEBOOK_PAGE_ID?.trim() || process.env.FACEBOOK_CITY_PAGE_ID?.trim();
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();

  if (!pageId || !accessToken) {
    return { posted: false as const, reason: "not_configured" as const };
  }

  const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });

  const data = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) {
    return {
      posted: false as const,
      reason: "send_failed" as const,
      error: data.error?.message ?? "Facebook post failed.",
    };
  }

  return {
    posted: true as const,
    postId: data.id,
    postUrl: `https://www.facebook.com/${data.id}`,
  };
}

export async function publishCommsSocialPost(itemId: string, user: Pick<PublicMember, "id" | "name">) {
  const item = await getCommsCalendarItemById(itemId);
  if (!item) {
    throw new Error("Calendar item not found.");
  }

  if (!isSocialChannel(item.channel)) {
    throw new Error("Social posting is only available for Facebook and Instagram calendar items.");
  }

  const promoteError = promoteCommsCalendarItemError(item);
  if (promoteError) {
    throw new Error(promoteError);
  }

  const caption = buildSocialCaption(item);
  const promotedAs: CommsPromotedAs = { ...(item.promotedAs ?? {}) };

  if (item.channel === "facebook") {
    const result = await postFacebookFeed(caption);
    if (!result.posted) {
      if (result.reason === "not_configured") {
        return {
          item,
          caption,
          autoPosted: false,
          message:
            "Facebook auto-post is not configured. Copy the caption and post manually, or set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN.",
        };
      }
      throw new Error(result.error ?? "Could not post to Facebook.");
    }

    promotedAs.facebookPostId = result.postId;
    promotedAs.socialPostUrl = result.postUrl;
    promotedAs.socialPostedAt = new Date().toISOString();
  } else {
    promotedAs.socialPostedAt = new Date().toISOString();
  }

  const updated = await saveCommsCalendarItem({
    ...item,
    status: "published",
    promotedAs,
  });

  return {
    item: updated,
    caption,
    autoPosted: item.channel === "facebook" && Boolean(promotedAs.facebookPostId),
    message:
      item.channel === "instagram"
        ? "Instagram requires posting in the app. Caption copied — add your graphic and paste in Instagram."
        : "Posted to Facebook.",
  };
}
