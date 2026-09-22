import type { UrgentAlert } from "@/lib/urgent-alert-types";
import { upsertUrgentAlertCommunityPost } from "@/lib/member-server";
import { site } from "@/lib/site";
import {
  communityPostIdForUrgentAlert,
  urgentAlertCommunityPostContent,
} from "@/lib/urgent-alert-utils";

export async function syncUrgentAlertToCommunityNews(alert: UrgentAlert) {
  const author = alert.createdByName?.trim() || site.name;
  return upsertUrgentAlertCommunityPost({
    postId: communityPostIdForUrgentAlert(alert.id),
    author,
    authorId: alert.createdBy,
    content: urgentAlertCommunityPostContent(alert),
    imageUrl: alert.imageUrl,
    videoUrl: alert.videoUrl,
  });
}
